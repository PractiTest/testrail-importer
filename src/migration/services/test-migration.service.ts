import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNull, Not } from 'typeorm';

import { EntityMigrationService } from './entity-migration.service';
import { executeAllChunkedAsync } from 'src/core/utils/api.utils';

import {
	Dictionary,
	EntityMigrationStatus,
	MigrationAction,
	MigrationEntityStep,
	MigrationEntityStepStage,
	PTEntity,
	TREntity,
} from 'src/core/types/migration';
import { TRTestsApiService } from 'src/test-rail/data-services';
import { PTInstancesApiService } from 'src/practi-test/data-services';
import { PTRateLimitService } from 'src/practi-test/http/pt-rate-limit.service';
import { TRRateLimitService } from 'src/test-rail/http/tr-rate-limit.service';
import { TRRunDto } from 'src/test-rail/types/run.dto';
import { TRTestDto } from 'src/test-rail/types/test.dto';
import { TRData } from 'src/core/db/entities/test-rail.entity';
import { TRUserDto } from 'src/test-rail/types/user.dto';
import { PTInstanceDto, PTNewInstanceData } from 'src/practi-test/types/instance.dto';
import { PTCustomFieldDto, PTTestCustomFieldsList } from 'src/practi-test/types/custom-field.dto';
import { IPTCustomFields } from 'src/practi-test/types/general-types';
import { LoggingService } from 'src/core/logging/logging.service';
import { chunk } from 'lodash';
import {
	IS_TESTRAIL_CLOUD_INSTANCE,
	MIGRATION_CHUNK_SIZE_MULTIPLIERS,
	MIGRATION_ENTITY_STEPS_ENV_MAP,
	MIGRATION_ENTITY_STEPS_SEQUENCE,
} from 'src/migration/config/configuration';
import { IMigrationProcessInfo } from 'src/migration/types/migration-process-info.interface';
import { IAppConfig } from 'src/core/types/app.config';

@Injectable()
export class TestMigrationService extends EntityMigrationService {
	protected type = MigrationEntityStep.TEST;

	constructor(
		private readonly trTestsApiService: TRTestsApiService,
		private readonly ptInstancesApiService: PTInstancesApiService,
		private readonly ptRateLimitService: PTRateLimitService,
		private readonly trRateLimitService: TRRateLimitService,
		private readonly configService: ConfigService<IAppConfig>,
		protected readonly logger: LoggingService,
	) {
		super();
		logger.setContext(TestMigrationService.name);
	}

	public getShouldExecuteEntityMigration = async (migrationProcess: IMigrationProcessInfo): Promise<boolean> => {
		if (migrationProcess.migratedEntitySteps.includes(MigrationEntityStep.TEST)) {
			return false;
		}

		const initialEntityIndex = MIGRATION_ENTITY_STEPS_SEQUENCE.indexOf(migrationProcess.initialEntityStep);
		const currentEntityIndex = MIGRATION_ENTITY_STEPS_SEQUENCE.indexOf(MigrationEntityStep.TEST);

		const requiredEntities: MigrationEntityStep[] = [
			MigrationEntityStep.USER,
			MigrationEntityStep.CASE,
			MigrationEntityStep.RUN,
		];
		const isDependenciesMigrated = requiredEntities.every((i) => migrationProcess.migratedEntitySteps.includes(i));

		return (
			initialEntityIndex <= currentEntityIndex &&
			!!MIGRATION_ENTITY_STEPS_ENV_MAP.get(MigrationEntityStep.TEST) &&
			isDependenciesMigrated
		);
	};

	public pullAllRequiredData = async (): Promise<void> => {
		await this.fetchPTTestInstances();
	};

	public pullNextTrDataPortion = async (portionSize?: number): Promise<boolean> => await this.fetchNextTRTestsPortion(portionSize);

	public compareAwaitingData = async (): Promise<void> => {
		const trTestsData = await this.trDataService.find<TRTestDto>(TREntity.TEST, {
			projectId: this.sourceProjectId,
			migrationAction: IsNull(),
		});
		const trPtInstanceIdsMap = await this.getTrPtInstanceIdsMap();

		this.logger.log({ message: `Found ${trTestsData.length} tests to compare. Processing` });

		const newTrTestsData = trTestsData.map((trTestData): TRData<TRTestDto> => {
			const ptInstanceId = trPtInstanceIdsMap.get(trTestData.attributes.id);

			if (ptInstanceId) {
				return {
					...trTestData,
					ptEntityId: ptInstanceId,
					migrationAction: MigrationAction.IGNORE,
				};
			}

			trTestData.migrationAction = MigrationAction.INSERT;

			return trTestData;
		});

		await this.trDataService.update(newTrTestsData);
		this.statisticsService.increaseProcessedEntitiesCount(
			this.type,
			MigrationEntityStepStage.COMPARING,
			'tr_test',
			newTrTestsData.length,
		);
	};

	public verifyPreviouslyUnfinishedData = async (): Promise<void> => {
		const trTestsData = await this.trDataService.find<TRTestDto>(TREntity.TEST, {
			projectId: this.sourceProjectId,
			migrationStatus: EntityMigrationStatus.PENDING,
		});

		const ptGetTestsByProjectId = this.ptRateLimitService.throttle(this.ptInstancesApiService.getInstancesByProjectId);

		for (const trTestData of trTestsData) {
			const data: PTInstanceDto[] = [];
			const pageSize = 250;
			let nextPage: number | null | undefined = 1;
			while (nextPage) {
				const response = await ptGetTestsByProjectId(this.destinationProjectId, {
					filters: {
						nameExact: trTestData.attributes.title,
					},
					pagination: {
						pageNumber: nextPage,
						pageSize,
					},
				});

				data.push(...response.data);
				nextPage = response?.meta?.nextPage;
			}

			if (data.length > 0) {
				const ptCustomFields = await this.ptDataService.get<PTCustomFieldDto>(PTEntity.CUSTOM_FIELD);

				const ptFieldTrTestId = ptCustomFields.find(
					({ attributes: ptCustomField }: { attributes: PTCustomFieldDto }) =>
						ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_TEST_ID.toLowerCase(),
				);

				const ptEntity = data.find(
					(ptTest) => ptTest.attributes.customFields[`---f-${ptFieldTrTestId?.id}`] === trTestData.id,
				);

				if (ptEntity) {
					await this.trDataService.update([
						{ ...trTestData, migrationStatus: EntityMigrationStatus.MIGRATED, ptEntityId: ptEntity.id },
					]);

					continue;
				}
			}

			await this.trDataService.update([{ ...trTestData, migrationStatus: EntityMigrationStatus.NOT_MIGRATED }]);
		}
	};

	public pushData = async (): Promise<void> => {
		const ptCustomFields = await this.ptDataService.get<PTCustomFieldDto>(PTEntity.CUSTOM_FIELD);
		const trRunsData = await this.trDataService.get<TRRunDto>(TREntity.RUN);

		const trPtUserIdsMap = await this.getTrPtUserIdsMap();
		const trPtCaseIdsMap = await this.getTrPtCaseIdsMap();
		const failedTrTestsData: TRData<TRTestDto>[] = [];
		const trTestsData = (
			await this.trDataService.find<TRTestDto>(TREntity.TEST, {
				projectId: this.sourceProjectId,
				migrationAction: Not(MigrationAction.IGNORE),
				migrationStatus: EntityMigrationStatus.NOT_MIGRATED,
			})
		).filter((trTestData) => {
			const ptTestId = trPtCaseIdsMap.get(Number(trTestData.attributes.caseId));
			const curTestRun = trRunsData.find((trRunData) => trRunData.id === trTestData.parentId);

			if (!ptTestId) {
				trTestData.errors.push('Parent Case does not have corresponding PractiTest entity');
			}

			if (!curTestRun) {
				trTestData.errors.push('Parent Run does not have corresponding PractiTest entity');
			}

			if (trTestData.errors.length > 0) {
				trTestData.migrationStatus = EntityMigrationStatus.FAILED;
				failedTrTestsData.push(trTestData);

				return false;
			}

			return true;
		});

		await this.trDataService.update(failedTrTestsData);
		this.logger.progress.setTotal(failedTrTestsData.length + trTestsData.length);
		this.logger.progress.setProgress(failedTrTestsData.length);
		this.logger.progress.setBarVisible(true);
		this.statisticsService.increaseFailedEntitiesCount(
			this.type,
			MigrationEntityStepStage.PUSHING,
			'tr_test',
			failedTrTestsData.length,
		);

		const ptBulkCreateInstances = this.ptRateLimitService.throttle(this.ptInstancesApiService.bulkCreateInstances);

		const ptFieldTrTestId = ptCustomFields.find(
			({ attributes: ptCustomField }) =>
				ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_TEST_ID.toLowerCase(),
		);

		if (!ptFieldTrTestId) {
			const errorMessage = `Custom field "${PTTestCustomFieldsList.TESTRAIL_TEST_ID}" does not exist`;
			throw new Error(errorMessage);
		}

		if (trTestsData.length === 0) {
			return;
		}

		const trTestsDataChunks = chunk(trTestsData, 20);

		const chunkSize =
			this.configService.get('ENABLE_CHUNKED_PUSH', 'false') === 'true' &&
			this.configService.get('ENABLE_BULK_CHUNKED_PUSH', 'false') === 'true'
				? Math.ceil(+this.configService.get('PRACTITEST_API_LIMIT', 100) * MIGRATION_CHUNK_SIZE_MULTIPLIERS.TESTS)
				: 1;

		await executeAllChunkedAsync(trTestsDataChunks, chunkSize, async (curTrTestsDataChunk) => {
			const newTestInstances = curTrTestsDataChunk.map((trTestData): PTNewInstanceData => {
				const instanceCustomFields: Dictionary = {
					[`---f-${ptFieldTrTestId.id}`]: trTestData.attributes.id,
				};
				const ptAssignedToId = trPtUserIdsMap.get(Number(trTestData.attributes.assignedToId));
				const ptTestId = trPtCaseIdsMap.get(Number(trTestData.attributes.caseId));
				const curTestRun = trRunsData.find((trRunData) => trRunData.id === trTestData.parentId);

				return {
					attributes: {
						setId: Number(curTestRun?.ptEntityId),
						testId: Number(ptTestId),
						assignedToId: Number(ptAssignedToId) ?? null,
						customFields: instanceCustomFields,
					},
				};
			});

			await this.trDataService.update(
				curTrTestsDataChunk.map((trTestData) => ({ ...trTestData, migrationStatus: EntityMigrationStatus.PENDING })),
			);
			const { data } = await ptBulkCreateInstances(this.destinationProjectId, newTestInstances);
			const createdPtInstances: PTInstanceDto[] = [];

			if (Array.isArray(data)) {
				createdPtInstances.push(...data);
			} else if (data !== null && typeof data === 'object') {
				createdPtInstances.push(data);
			}

			const newTrTestsData = curTrTestsDataChunk.map(
				(trTestData): TRData<TRTestDto> => ({
					...trTestData,
					migrationStatus: EntityMigrationStatus.MIGRATED,
					ptEntityId: createdPtInstances.find(
						(createdInstance) =>
							(
								createdInstance.attributes.customFields[`---f-${ptFieldTrTestId.id}`] as string | undefined
							)?.toString() === trTestData.id,
					)?.id,
				}),
			);

			await this.ptDataService.save(this.destinationProjectId, PTEntity.INSTANCE, createdPtInstances);
			await this.trDataService.update(newTrTestsData);

			this.statisticsService.increaseProcessedEntitiesCount(
				this.type,
				MigrationEntityStepStage.PUSHING,
				'tr_test',
				newTrTestsData.length,
			);
			this.logger.progress.addProgress(curTrTestsDataChunk.length);
		});
	};

	private readonly getTrPtUserIdsMap = async (): Promise<Map<number, string>> => {
		const trUsersData = await this.trDataService.get<TRUserDto>(TREntity.USER);
		const trPtUserIdsMap = new Map<number, string>();

		trUsersData.forEach((trUserData) => {
			if (trUserData.ptEntityId) {
				trPtUserIdsMap.set(trUserData.attributes.id, trUserData.ptEntityId);
			}
		});

		return trPtUserIdsMap;
	};

	private readonly getTrPtCaseIdsMap = async (): Promise<Map<number, string>> => {
		const trCasesData = await this.trDataService.get<TRTestDto>(TREntity.CASE);
		const trPtCaseIdsMap = new Map<number, string>();

		trCasesData.forEach((trCaseData) => {
			if (trCaseData.ptEntityId) {
				trPtCaseIdsMap.set(trCaseData.attributes.id, trCaseData.ptEntityId);
			}
		});

		return trPtCaseIdsMap;
	};

	private readonly getTrPtInstanceIdsMap = async (): Promise<Map<number, string>> => {
		const ptInstancesData = await this.ptDataService.get<PTInstanceDto>(PTEntity.INSTANCE);
		const ptCustomFieldsData = await this.ptDataService.get<PTCustomFieldDto>(PTEntity.CUSTOM_FIELD);
		const trPtInstanceIdsMap = new Map<number, string>();

		const ptFieldTrTestId = ptCustomFieldsData.find(
			({ attributes: ptCustomField }) =>
				ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_TEST_ID.toLowerCase(),
		);

		if (!ptFieldTrTestId) {
			const errorMessage = `Custom field "${PTTestCustomFieldsList.TESTRAIL_TEST_ID}" does not exist`;
			throw new Error(errorMessage);
		}

		ptInstancesData.forEach(({ attributes: ptTestSet }) => {
			const customFields = ptTestSet.attributes.customFields as IPTCustomFields;

			const trRunId = customFields[`---f-${ptFieldTrTestId.id}`] as string | undefined;

			if (trRunId) {
				trPtInstanceIdsMap.set(Number(trRunId), ptTestSet.id);
			}
		});

		return trPtInstanceIdsMap;
	};

	private readonly fetchNextTRTestsPortion = async (portionSize?: number): Promise<boolean> => {
		const trRunsCount = await this.trDataService.countBy(TREntity.RUN, {
			projectId: this.sourceProjectId,
			isChildItemsFetched: false,
		});

		if (trRunsCount === 0) {
			return false;
		}

		const trRunData = await this.trDataService.findOne<TRRunDto>(TREntity.RUN, {
			projectId: this.sourceProjectId,
			isChildItemsFetched: false,
		});

		if (!trRunData) {
			return false;
		}

		const hasMoreItems = await this.fetchTRTestsByRunIdPortion(trRunData.id, portionSize);
		await this.trDataService.update([{ ...trRunData, isChildItemsFetched: !hasMoreItems }]);

		return trRunsCount > 0;
	};

	private readonly fetchTRTestsByRunIdPortion = async (runId: string, portionSize?: number): Promise<boolean> => {
		const trGetTestsByRunId = this.trRateLimitService.throttle(this.trTestsApiService.getTestsByRunId);
		const trTestsCount = await this.trDataService.count(TREntity.TEST, this.sourceProjectId, TREntity.RUN, runId);

		const pageSize = Math.min(250, portionSize ?? 250);
		let page = Math.ceil(trTestsCount / pageSize);
		let pulledItemsCount = 0;

		let hasMoreItems: boolean;
		let reachedPortionLimit: boolean;
		do {
			const response = await trGetTestsByRunId(Number(runId), IS_TESTRAIL_CLOUD_INSTANCE ? {
				pagination: {
					limit: pageSize,
					offset: pageSize * page,
				},
			} : undefined);
			await this.trDataService.save(this.sourceProjectId, TREntity.TEST, response.tests, TREntity.RUN, runId);
			this.statisticsService.increaseProcessedEntitiesCount(
				this.type,
				MigrationEntityStepStage.PULLING,
				'tr_test',
				response?.tests.length,
			);
			page++;
			hasMoreItems = !!response?._links?.next;
			pulledItemsCount += response?.tests?.length;
			reachedPortionLimit = !portionSize ? false : pulledItemsCount >= portionSize;
			// eslint-disable-next-line no-unmodified-loop-condition
		} while (IS_TESTRAIL_CLOUD_INSTANCE && hasMoreItems && !reachedPortionLimit);

		return hasMoreItems;
	};

	private readonly fetchPTTestInstances = async (): Promise<void> => {
		const ptGetInstancesByProjectId = this.ptRateLimitService.throttle(
			this.ptInstancesApiService.getInstancesByProjectId,
		);

		const ptTestsCount = await this.ptDataService.count(PTEntity.INSTANCE, this.destinationProjectId);

		const pageSize = 250;
		let nextPage: number | null | undefined = Math.ceil(ptTestsCount / pageSize) + 1;
		while (nextPage) {
			const response = await ptGetInstancesByProjectId(this.destinationProjectId, {
				pagination: {
					pageNumber: nextPage,
					pageSize,
				},
			});
			await this.ptDataService.save(this.destinationProjectId, PTEntity.INSTANCE, response.data);
			this.statisticsService.increaseProcessedEntitiesCount(
				this.type,
				MigrationEntityStepStage.PULLING,
				'pt_instance',
				response.data.length,
			);
			nextPage = response?.meta?.nextPage;
		}
	};
}
