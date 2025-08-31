import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EntityMigrationService } from './entity-migration.service';
import {
	Dictionary,
	EntityMigrationStatus,
	MigrationAction,
	MigrationEntityStep,
	MigrationEntityStepStage,
	PTEntity,
	TREntity,
} from 'src/core/types/migration';
import { TRPlansApiService, TRRunsApiService } from 'src/test-rail/data-services';
import { PTTestSetsApiService } from 'src/practi-test/data-services';
import { PTRateLimitService } from 'src/practi-test/http/pt-rate-limit.service';
import { TRRateLimitService } from 'src/test-rail/http/tr-rate-limit.service';
import { TRPlanDto } from 'src/test-rail/types/plan.dto';
import { executeAllChunkedAsync } from 'src/core/utils/api.utils';
import { TRRunDto } from 'src/test-rail/types/run.dto';
import { PTCustomFieldDto, PTTestCustomFieldsList } from 'src/practi-test/types/custom-field.dto';
import { IPTCustomFields } from 'src/practi-test/types/general-types';
import { PTTestSetDto } from 'src/practi-test/types/testset.dto';
import { TRUserDto } from 'src/test-rail/types/user.dto';
import { TRData } from 'src/core/db/entities/test-rail.entity';
import { PTUserDto } from 'src/practi-test/types/user.dto';
import { MigrationExtraEntities } from 'src/core/statistics/statistics.types';
import { LoggingService } from 'src/core/logging/logging.service';
import {
	IS_TESTRAIL_CLOUD_INSTANCE,
	MIGRATION_CHUNK_SIZE_MULTIPLIERS,
	MIGRATION_ENTITY_STEPS_ENV_MAP,
	MIGRATION_ENTITY_STEPS_SEQUENCE
} from 'src/migration/config/configuration';
import { IsNull } from 'typeorm';
import { IMigrationProcessInfo } from 'src/migration/types/migration-process-info.interface';
import { IAppConfig } from 'src/core/types/app.config';

@Injectable()
export class RunMigrationService extends EntityMigrationService {
	protected type = MigrationEntityStep.RUN;

	constructor(
		private readonly trRunsApiService: TRRunsApiService,
		private readonly trPlansApiService: TRPlansApiService,
		private readonly ptTestSetsApiService: PTTestSetsApiService,
		private readonly ptRateLimitService: PTRateLimitService,
		private readonly trRateLimitService: TRRateLimitService,
		private readonly configService: ConfigService<IAppConfig>,
		protected readonly logger: LoggingService,
	) {
		super();
		logger.setContext(RunMigrationService.name);
	}

	public getShouldExecuteEntityMigration = async (migrationProcess: IMigrationProcessInfo): Promise<boolean> => {
		if (migrationProcess.migratedEntitySteps.includes(MigrationEntityStep.RUN)) {
			return false;
		}

		const initialEntityIndex = MIGRATION_ENTITY_STEPS_SEQUENCE.indexOf(migrationProcess.initialEntityStep);
		const currentEntityIndex = MIGRATION_ENTITY_STEPS_SEQUENCE.indexOf(MigrationEntityStep.RUN);

		const requiredEntities: MigrationEntityStep[] = [
			MigrationEntityStep.USER
		];
		const isDependenciesMigrated = requiredEntities.every((i) => migrationProcess.migratedEntitySteps.includes(i));

		return (
			(initialEntityIndex <= currentEntityIndex) &&
			!!MIGRATION_ENTITY_STEPS_ENV_MAP.get(MigrationEntityStep.RUN) &&
			isDependenciesMigrated
		);
	};

	public pullAllRequiredData = async (): Promise<void> => {
		await Promise.all([this.fetchPTTestSets(), this.fetchTrPlans()]);
		await this.extendAllTrPlansWithEntries();
	};

	public pullNextTrDataPortion = async (portionSize?: number): Promise<boolean> => {
		const hasNextPortion = this.fetchTrRunsPortion(portionSize);
		await this.mergeAwaitingRunsWithPlans();

		return hasNextPortion;
	};

	public compareAwaitingData = async (): Promise<void> => {
		const trPtTestRunIdsMap = await this.getTrPtTestRunIdsMap();

		const trRunsData = await this.trDataService.find<TRRunDto>(TREntity.RUN, {
			projectId: this.sourceProjectId,
			migrationAction: IsNull()
		});

		const newTrRunsData = trRunsData.map((trRunData): TRData<TRRunDto> => {
			const ptEntityId = trPtTestRunIdsMap.get(trRunData.attributes.id);

			if (trPtTestRunIdsMap.has(trRunData.attributes.id)) {
				return {
					...trRunData,
					ptEntityId,
					migrationAction: MigrationAction.IGNORE,
				};
			}

			return {
				...trRunData,
				migrationAction: MigrationAction.INSERT,
			};
		});

		await this.trDataService.update(newTrRunsData);

		this.statisticsService.increaseProcessedEntitiesCount(
			this.type,
			MigrationEntityStepStage.COMPARING,
			'tr_run',
			newTrRunsData.length,
		);
	};

	public verifyPreviouslyUnfinishedData = async (): Promise<void> => {
		const trRunsData = await this.trDataService.find<TRRunDto>(TREntity.RUN, {
			projectId: this.sourceProjectId,
			migrationStatus: EntityMigrationStatus.PENDING,
		});

		const ptGetTestSetsByProjectId = this.ptRateLimitService.throttle(this.ptTestSetsApiService.getTestSetsByProjectId);

		for (const trRunData of trRunsData) {
			const data: PTTestSetDto[] = [];
			const pageSize = 250;
			let nextPage: number | null | undefined = 1;
			while (nextPage) {
				const response = await ptGetTestSetsByProjectId(this.destinationProjectId, {
					filters: {
						nameExact: trRunData.attributes.name,
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

				const ptFieldTrRunId = ptCustomFields.find(
					({ attributes: ptCustomField }: { attributes: PTCustomFieldDto }) =>
						ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_RUN_ID.toLowerCase(),
				);

				const ptEntity = data.find(
					(ptTest) => ptTest.attributes.customFields[`---f-${ptFieldTrRunId?.id}`] === trRunData.id,
				);

				if (ptEntity) {
					await this.trDataService.update([
						{ ...trRunData, migrationStatus: EntityMigrationStatus.MIGRATED, ptEntityId: ptEntity.id },
					]);

					continue;
				}
			}

			await this.trDataService.update([{ ...trRunData, migrationStatus: EntityMigrationStatus.NOT_MIGRATED }]);
		}
	};

	public pushData = async (): Promise<void> => {
		const trRunsData = await this.trDataService.find<TRRunDto>(TREntity.RUN, {
			projectId: this.sourceProjectId,
			migrationAction: MigrationAction.INSERT,
			migrationStatus: EntityMigrationStatus.NOT_MIGRATED,
		});
		const ptUsersData = await this.ptDataService.get<PTUserDto>(PTEntity.USER);
		const ptCustomFields = await this.ptDataService.get<PTCustomFieldDto>(PTEntity.CUSTOM_FIELD);

		const ptFieldTrRunId = ptCustomFields.find(
			({ attributes: ptCustomField }) =>
				ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_RUN_ID.toLowerCase(),
		);

		const ptFieldTrRunConfig = ptCustomFields.find(
			({ attributes: ptCustomField }) =>
				ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_RUN_CONFIG.toLowerCase(),
		);

		if (!ptFieldTrRunId || !ptFieldTrRunConfig) {
			return;
		}

		const fallbackUser = ptUsersData.find(
			({ attributes: ptUser }) => ptUser.attributes.email === this.fallbackUserEmail,
		);
		const trPtUserIdsMap = await this.getTrPtUserIdsMap();
		const ptCreateTestSet = this.ptRateLimitService.throttle(this.ptTestSetsApiService.createTestSet);

		this.logger.progress.setTotal(trRunsData.length);
		this.logger.progress.setProgress(0);
		this.logger.progress.setBarVisible(true);

		const chunkSize = this.configService.get('ENABLE_CHUNKED_PUSH', 'false') === 'true'
			? Math.ceil(+this.configService.get('PRACTITEST_API_LIMIT', 100) * MIGRATION_CHUNK_SIZE_MULTIPLIERS.RUNS)
			: 1;

		await executeAllChunkedAsync(trRunsData, chunkSize, async (trRunData) => {
			const trRun = trRunData.attributes;

			const testSetCustomFields: Dictionary = {
				[`---f-${ptFieldTrRunId.id}`]: trRun.id,
				[`---f-${ptFieldTrRunConfig.id}`]: trRun.config,
			};

			const ptAuthorId = trPtUserIdsMap.get(trRun.createdBy);
			const ptAssignedToId = trPtUserIdsMap.get(trRun.assignedToId);

			await this.trDataService.update([{ ...trRunData, migrationStatus: EntityMigrationStatus.PENDING }]);
			try {
				const { data: createdPtTestSet } = await ptCreateTestSet(this.destinationProjectId, {
					attributes: {
						name: `${trRun.name}${trRun.config ? ` - [${trRun.config}]` : ''}`,
						assignedToId: !ptAssignedToId ? null : Number(ptAssignedToId),
						authorId: !ptAuthorId ? Number(fallbackUser?.id) : Number(ptAuthorId),
						assignedToType: 'user',
						customFields: testSetCustomFields,
					},
				});

				await this.ptDataService.save(this.destinationProjectId, PTEntity.TEST_SET, [createdPtTestSet]);
				await this.trDataService.update([
					{ ...trRunData, ptEntityId: createdPtTestSet.id, migrationStatus: EntityMigrationStatus.MIGRATED },
				]);

				this.statisticsService.increaseProcessedEntitiesCount(this.type, MigrationEntityStepStage.PUSHING, 'tr_run', 1);
			} catch (e) {
				this.statisticsService.increaseFailedEntitiesCount(this.type, MigrationEntityStepStage.PUSHING, 'tr_run', 1);
				trRunData.errors.push(e.message);
				await this.trDataService.update([{ ...trRunData, migrationStatus: EntityMigrationStatus.FAILED }]);
			} finally {
				this.logger.progress.addProgress(1);
			}
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

	private readonly getTrPtTestRunIdsMap = async (): Promise<Map<number, string>> => {
		const ptTestSetsData = await this.ptDataService.get<PTTestSetDto>(PTEntity.TEST_SET);
		const trPtTestRunIdsMap = new Map<number, string>();
		const ptCustomFields = await this.ptDataService.get<PTCustomFieldDto>(PTEntity.CUSTOM_FIELD);

		const ptFieldTrRunId = ptCustomFields.find(
			({ attributes: ptCustomField }) =>
				ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_RUN_ID.toLowerCase(),
		);

		if (!ptFieldTrRunId) {
			const errorMessage = `Custom field "${PTTestCustomFieldsList.TESTRAIL_RUN_ID}" does not exist`;
			throw new Error(errorMessage);
		}

		ptTestSetsData.forEach(({ attributes: ptTestSet }) => {
			const customFields = ptTestSet.attributes.customFields as IPTCustomFields;

			const trRunId = customFields[`---f-${ptFieldTrRunId.id}`] as string | undefined;

			if (trRunId) {
				trPtTestRunIdsMap.set(Number(trRunId), ptTestSet.id);
			}
		});

		return trPtTestRunIdsMap;
	};

	private readonly fetchTrRunsPortion = async (portionSize?: number): Promise<boolean> => {
		const trGetRunsByProjectId = this.trRateLimitService.throttle(this.trRunsApiService.getRunsByProjectId);
		const trRunsCount = await this.trDataService.count(TREntity.RUN, this.sourceProjectId);

		const pageSize = Math.min(250, portionSize ?? 250);
		let page = Math.ceil(trRunsCount / pageSize);
		let pulledItemsCount = 0;

		let hasMoreItems: boolean;
		let reachedPortionLimit: boolean;
		do {
			const response = await trGetRunsByProjectId(this.sourceProjectId, IS_TESTRAIL_CLOUD_INSTANCE ? {
				pagination: {
					limit: pageSize,
					offset: pageSize * page,
				},
			} : undefined);
			await this.trDataService.save(this.sourceProjectId, TREntity.RUN, response.runs);
			this.statisticsService.increaseProcessedEntitiesCount(
				this.type,
				MigrationEntityStepStage.PULLING,
				'tr_run',
				response?.runs.length,
			);
			page++;
			hasMoreItems = !!response?._links?.next;
			pulledItemsCount += response?.runs?.length;
			reachedPortionLimit = !portionSize ? false : pulledItemsCount >= portionSize;
			// eslint-disable-next-line no-unmodified-loop-condition
		} while (IS_TESTRAIL_CLOUD_INSTANCE && hasMoreItems && !reachedPortionLimit);

		return hasMoreItems;
	};

	private readonly fetchTrPlans = async (): Promise<void> => {
		const trGetPlansByProjectId = this.trRateLimitService.throttle(this.trPlansApiService.getPlansByProjectId);
		const trPlansCount = await this.trDataService.count(TREntity.PLAN, this.sourceProjectId);

		const limit = 250;
		let page = Math.ceil(trPlansCount / limit);
		let next: string | null | undefined;
		do {
			const response = await trGetPlansByProjectId(this.sourceProjectId, IS_TESTRAIL_CLOUD_INSTANCE ? {
				pagination: {
					limit,
					offset: limit * page,
				},
			} : undefined);
			await this.trDataService.save(
				this.sourceProjectId,
				TREntity.PLAN,
				response.plans.map((plan) => ({ ...plan, migrationAction: MigrationAction.CLARIFY })),
			);

			this.statisticsService.increaseProcessedEntitiesCount(
				this.type,
				MigrationEntityStepStage.PULLING,
				'tr_plan',
				response.plans.length,
			);

			next = response?._links?.next;
			page++;
			// eslint-disable-next-line no-unmodified-loop-condition
		} while (IS_TESTRAIL_CLOUD_INSTANCE && next);
	};

	private readonly extendAllTrPlansWithEntries = async (): Promise<void> => {
		const trPlansData = await this.trDataService.find<TRPlanDto>(TREntity.PLAN, {
			migrationAction: MigrationAction.CLARIFY,
		});
		const chunkSize = Math.ceil(+this.configService.get('TESTRAIL_API_LIMIT', 100) / 2);
		await executeAllChunkedAsync(trPlansData, chunkSize, async (trPlanData) => {
			await this.extendTrPlanWithEntriesById(trPlanData.attributes.id);
		});
	};

	private readonly extendTrPlanWithEntriesById = async (trPlanId: number): Promise<TRPlanDto> => {
		const trGetPlanById = this.trRateLimitService.throttle(this.trPlansApiService.getPlanById);
		const response = await trGetPlanById(trPlanId);
		await this.trDataService.upsert<TRPlanDto>(this.sourceProjectId, TREntity.PLAN, [
			{ ...response, migrationAction: MigrationAction.COMPARE },
		]);

		this.statisticsService.increaseProcessedEntitiesCount(
			this.type,
			MigrationEntityStepStage.PULLING,
			MigrationExtraEntities.TR_PLAN_WITH_ENTRIES,
			1,
		);

		return response;
	};

	private readonly fetchPTTestSets = async (): Promise<void> => {
		const ptGetTestSetsByProjectId = this.ptRateLimitService.throttle(this.ptTestSetsApiService.getTestSetsByProjectId);
		const ptTestSetsCount = await this.ptDataService.count(PTEntity.TEST_SET, this.destinationProjectId);

		const pageSize = 250;
		let nextPage: number | null | undefined = Math.floor(ptTestSetsCount / pageSize) + 1;
		while (nextPage) {
			const response = await ptGetTestSetsByProjectId(this.destinationProjectId, {
				pagination: {
					pageNumber: nextPage,
					pageSize,
				},
			});
			await this.ptDataService.save(this.destinationProjectId, PTEntity.TEST_SET, response.data);
			this.statisticsService.increaseProcessedEntitiesCount(
				this.type,
				MigrationEntityStepStage.PULLING,
				'pt_testset',
				response.data.length,
			);
			nextPage = response?.meta?.nextPage;
		}
	};

	private readonly mergeAwaitingRunsWithPlans = async (): Promise<void> => {
		const trPlansData = await this.trDataService.find<TRPlanDto>(TREntity.PLAN, {
			migrationAction: MigrationAction.COMPARE,
		});

		// Only extend runs, that are waiting to be pushed
		const trRunsData = await this.trDataService.find<TRRunDto>(TREntity.RUN, {
			migrationStatus: EntityMigrationStatus.NOT_MIGRATED,
		});
		const waitingRunsIds = new Set(trRunsData.map((x) => x.id));

		const mergingRuns: TRRunDto[] = [];

		for (const plan of trPlansData) {
			for (const planEntry of plan.attributes.entries) {
				for (const run of planEntry.runs) {
					if (waitingRunsIds.has(String(run.id))) {
						mergingRuns.push(run);
					}
				}
			}
		}

		await this.trDataService.upsert<TRRunDto>(this.sourceProjectId, TREntity.RUN, mergingRuns);

		this.statisticsService.increaseProcessedEntitiesCount(
			this.type,
			MigrationEntityStepStage.PULLING,
			'tr_run',
			mergingRuns.length,
		);
	};
}
