import { Injectable } from '@nestjs/common';

import { EntityMigrationService } from './entity-migration.service';

import {
	Dictionary, EntityMigrationStatus, MigrationAction, MigrationEntityStep, MigrationEntityStepStage, PTEntity, TREntity
} from 'src/core/types/migration';
import { resultStatusesMap, TRResultsApiService, TRResultStatusType } from 'src/test-rail/data-services';
import { PTRunsApiService } from 'src/practi-test/data-services';
import { PTRateLimitService } from 'src/practi-test/http/pt-rate-limit.service';
import { TRRateLimitService } from 'src/test-rail/http/tr-rate-limit.service';
import { ConfigService } from '@nestjs/config';
import { executeAllChunkedAsync } from 'src/core/utils/api.utils';
import { TRTestDto } from 'src/test-rail/types/test.dto';
import { TRResultDto } from 'src/test-rail/types/result.dto';
import { PTNewRunData, PTRunDto, PTRunStep, PTRunStepMigration, PTRunType } from 'src/practi-test/types/run.dto';
import { TRData } from 'src/core/db/entities/test-rail.entity';
import { PTCustomFieldDto, PTTestCustomFieldsList } from 'src/practi-test/types/custom-field.dto';
import { IPTCustomFields } from 'src/practi-test/types/general-types';
import { TRUserDto } from 'src/test-rail/types/user.dto';
import { IsNull, Not } from 'typeorm';
import { pickBy } from 'lodash';
import {
	IS_TESTRAIL_CLOUD_INSTANCE,
	MIGRATION_CHUNK_SIZE_MULTIPLIERS,
	MIGRATION_ENTITY_STEPS_ENV_MAP,
	MIGRATION_ENTITY_STEPS_SEQUENCE
} from 'src/migration/config/configuration';
import { TRCustomFieldDto } from 'src/test-rail/types/custom-field.dto';
import { convertDurationToHMS, transformCustomFieldValue } from 'src/migration/migration.utils';
import { formatISO } from 'date-fns';
import { TRRunDto } from 'src/test-rail/types/run.dto';
import { PTData } from 'src/core/db/entities/practi-test.entity';
import { PTInstanceDto } from 'src/practi-test/types/instance.dto';
import { PTUserDto } from 'src/practi-test/types/user.dto';
import { IMigrationProcessInfo } from 'src/migration/types/migration-process-info.interface';
import { IAppConfig } from 'src/core/types/app.config';
import { extractAttachmentsFromString } from 'src/migration/utils';

@Injectable()
export class ResultMigrationService extends EntityMigrationService {
	protected type = MigrationEntityStep.RESULT;

	constructor(private readonly trResultsApiService: TRResultsApiService, private readonly ptRunsApiService: PTRunsApiService, private readonly ptRateLimitService: PTRateLimitService, private readonly trRateLimitService: TRRateLimitService, private readonly configService: ConfigService<IAppConfig>) {
		super();
	}

	public getShouldExecuteEntityMigration = async (migrationProcess: IMigrationProcessInfo): Promise<boolean> => {
		if (migrationProcess.migratedEntitySteps.includes(MigrationEntityStep.RESULT)) {
			return false;
		}

		const initialEntityIndex = MIGRATION_ENTITY_STEPS_SEQUENCE.indexOf(migrationProcess.initialEntityStep);
		const currentEntityIndex = MIGRATION_ENTITY_STEPS_SEQUENCE.indexOf(MigrationEntityStep.RESULT);

		const requiredEntities: MigrationEntityStep[] = [MigrationEntityStep.USER, MigrationEntityStep.CASE, MigrationEntityStep.RUN, MigrationEntityStep.TEST];
		const isDependenciesMigrated = requiredEntities.every((i) => migrationProcess.migratedEntitySteps.includes(i));

		return ((initialEntityIndex <= currentEntityIndex) && !!MIGRATION_ENTITY_STEPS_ENV_MAP.get(MigrationEntityStep.RESULT) && isDependenciesMigrated);
	};

	public pullAllRequiredData = async (): Promise<void> => {
		await this.fetchPTRuns();
	};

	public pullNextTrDataPortion = async (batchSize?: number): Promise<boolean> => await this.fetchTRTestResultsPortion(batchSize);

	public compareAwaitingData = async (): Promise<void> => {
		const trPtResultIdsMap = await this.getTrPtResultIdsMap();
		const trResultsData = await this.trDataService.find<TRResultDto>(TREntity.RESULT, {
			projectId: this.sourceProjectId, migrationAction: IsNull()
		});

		const newTrResultsData = trResultsData.map((trRunData): TRData<TRResultDto> => {
			const ptEntityId = trPtResultIdsMap.get(trRunData.attributes.id);

			if (trPtResultIdsMap.has(trRunData.attributes.id)) {
				return {
					...trRunData, ptEntityId, migrationAction: MigrationAction.IGNORE
				};
			}

			return {
				...trRunData, migrationAction: MigrationAction.INSERT
			};
		});

		await this.trDataService.update(newTrResultsData);

		this.statisticsService.increaseProcessedEntitiesCount(this.type, MigrationEntityStepStage.COMPARING, 'tr_result', newTrResultsData.length);
	};

	public verifyPreviouslyUnfinishedData = async (): Promise<void> => {
		const trResultsData = await this.trDataService.find<TRResultDto>(TREntity.RESULT, {
			projectId: this.sourceProjectId, migrationStatus: EntityMigrationStatus.PENDING
		});
		const trPtTestsMap = await this.getTrPtTestsMap();

		const ptGetRunsByProjectId = this.ptRateLimitService.throttle(this.ptRunsApiService.getRunsByProjectId);

		for (const trResultData of trResultsData) {
			const ptTestInstance = trPtTestsMap.get(Number(trResultData.attributes.testId));
			const data: PTRunDto[] = [];
			const pageSize = 250;
			let nextPage: number | null | undefined = 1;
			while (nextPage) {
				const response = await ptGetRunsByProjectId(this.destinationProjectId, {
					filters: {
						instanceIds: [Number(ptTestInstance?.id)] // TODO optimize
					}, pagination: {
						pageNumber: nextPage, pageSize
					}
				});

				data.push(...response.data);
				nextPage = response?.meta?.nextPage;
			}

			if (data.length > 0) {
				const ptCustomFields = await this.ptDataService.get<PTCustomFieldDto>(PTEntity.CUSTOM_FIELD);

				const ptFieldTrResultId = ptCustomFields.find(({ attributes: ptCustomField }: {
					attributes: PTCustomFieldDto
				}) => ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_RESULT_ID.toLowerCase());

				const ptEntity = data.find((ptTest) => ptTest.attributes.customFields[`---f-${ptFieldTrResultId?.id}`] === trResultData.id);

				if (ptEntity) {
					await this.trDataService.update([{
						...trResultData, migrationStatus: EntityMigrationStatus.MIGRATED, ptEntityId: ptEntity.id
					}]);

					continue;
				}
			}

			await this.trDataService.update([{ ...trResultData, migrationStatus: EntityMigrationStatus.NOT_MIGRATED }]);
		}
	};

	public pushData = async (): Promise<void> => {
		const ptCustomFields = await this.ptDataService.get<PTCustomFieldDto>(PTEntity.CUSTOM_FIELD);
		const trCustomFields = await this.trDataService.get<TRCustomFieldDto>(TREntity.RESULT_CUSTOM_FIELD);
		const trUsersData = await this.trDataService.get<TRUserDto>(TREntity.USER);
		const ptUsersData = await this.ptDataService.get<PTUserDto>(PTEntity.USER);

		const trPtUserIdsMap = await this.getTrPtUserIdsMap();
		//  const trPtResultIdsMap = await this.getTrPtResultIdsMap();
		// const trPtTestIdsMap = await this.getTrPtTestIdsMap();

		const trPtTestsMap = await this.getTrPtTestsMap();

		const failedTrResultsData: TRData<TRResultDto>[] = [];
		const trResultsData = (await this.trDataService.find<TRResultDto>(TREntity.RESULT, {
			projectId: this.sourceProjectId,
			migrationAction: Not(MigrationAction.IGNORE),
			migrationStatus: EntityMigrationStatus.NOT_MIGRATED
		})).filter((trResultData) => {
			const ptTestInstance = trPtTestsMap.get(Number(trResultData.attributes.testId));

			if (!ptTestInstance) {
				trResultData.errors.push('Parent TR Test does not have corresponding PractiTest entity');
			}

			if (trResultData.errors.length > 0) {
				trResultData.migrationStatus = EntityMigrationStatus.FAILED;
				failedTrResultsData.push(trResultData);

				return false;
			}

			return true;
		});

		await this.trDataService.update(failedTrResultsData);
		this.logger.progress.setTotal(failedTrResultsData.length + trResultsData.length);
		this.logger.progress.setProgress(failedTrResultsData.length);
		this.logger.progress.setBarVisible(true);
		this.statisticsService.increaseFailedEntitiesCount(this.type, MigrationEntityStepStage.PUSHING, 'tr_result', failedTrResultsData.length);

		const ptFieldTrResultId = ptCustomFields.find(({ attributes: ptCustomField }) => ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_RESULT_ID.toLowerCase());

		if (!ptFieldTrResultId) {
			const errorMessage = `Custom field "${PTTestCustomFieldsList.TESTRAIL_RESULT_ID}" does not exist`;
			throw new Error(errorMessage);
		}

		if (trResultsData.length === 0) {
			return;
		}

		const trTestsMap = await this.getTrTestsMap();

		// const trResultsDataChunks = chunk(trResultsData, 20);
		// const ptBulkCreateRuns = this.ptRateLimitService.throttle(this.ptRunsApiService.bulkCreateRuns);
		const ptCreateRun = this.ptRateLimitService.throttle(this.ptRunsApiService.createRun);
		const chunkSize = this.configService.get('ENABLE_CHUNKED_PUSH', 'false') === 'true' && this.configService.get('ENABLE_BULK_CHUNKED_PUSH', 'false') === 'true' ? Math.ceil(+this.configService.get('PRACTITEST_API_LIMIT', 100) * MIGRATION_CHUNK_SIZE_MULTIPLIERS.RESULTS) : 1;
		await executeAllChunkedAsync(trResultsData, chunkSize, async (trResultData) => {
			const runCustomFields: Dictionary = {
				[`---f-${ptFieldTrResultId.id}`]: trResultData.attributes.id
			};

			const customProps = pickBy(trResultData.attributes, (value, key) => key.startsWith('custom_') && value !== null);

			for (const [propKey, propValue] of Object.entries(customProps)) {
				if (propValue === undefined) {
					continue;
				}

				const trCustomFieldData = trCustomFields.find(({ attributes: trCustomField }) => trCustomField.systemName.toLowerCase() === propKey.toLowerCase());
				const ptCustomFieldData = ptCustomFields.find(({ attributes: ptCustomField }) => ptCustomField.attributes.name.toLowerCase() === propKey.toLowerCase());

				if (!trCustomFieldData || !ptCustomFieldData) {
					continue;
				}

				const transformedValue = transformCustomFieldValue(this.sourceProjectId, propValue, ptCustomFieldData.attributes.attributes.fieldFormat, trCustomFieldData.attributes, trUsersData);

				if (transformedValue !== null) {
					runCustomFields[`---f-${ptCustomFieldData.id}`] = transformedValue;
				}
			}

			const curPtInstance = trPtTestsMap.get(trResultData.attributes.testId);

			if (!curPtInstance) {
				return;
			}

			const resultStepsMigration = this.getStepsForTrResult(trResultData, trPtTestsMap, trTestsMap);

			const ptAssignedToId = trPtUserIdsMap.get(Number(trResultData.attributes.assignedToId));
			const fallbackUser = ptUsersData.find(({ attributes: ptUser }) => ptUser.attributes.email === this.fallbackUserEmail);

			const newRun: PTNewRunData = {
				attributes: {
					instanceId: Number(curPtInstance?.id), // assignedToType: 'user', // is not described in api docs
					customFields: runCustomFields,
					runDate: formatISO(new Date(trResultData.attributes.createdOn * 1000)),
					runType: PTRunType.MANUAL_RUN,
					runDuration: convertDurationToHMS(trResultData.attributes.elapsed ?? ''),
					testerId: Number(ptAssignedToId ?? fallbackUser?.id) ?? null
				}, steps: {
					data: resultStepsMigration.map((stepData): PTRunStep => stepData.step)
				}
			};

			await this.trDataService.update([{ ...trResultData, migrationStatus: EntityMigrationStatus.PENDING }]);
			const { data: createdPtRun } = await ptCreateRun(this.destinationProjectId, newRun);

			await this.ptDataService.save(this.destinationProjectId, PTEntity.RUN, [createdPtRun]);

			await this.trDataService.update([{
				...trResultData, migrationStatus: EntityMigrationStatus.MIGRATED, ptEntityId: createdPtRun.id, migrationData: {
					data: resultStepsMigration
				}
			}]);

			this.statisticsService.increaseProcessedEntitiesCount(this.type, MigrationEntityStepStage.PUSHING, 'tr_result', 1);
			this.logger.progress.addProgress(1);
		});

		/* await executeAllChunkedAsync(trResultsDataChunks, chunkSize, async (curTrResultsDataChunk) => {
			const newResults = curTrResultsDataChunk
				.map((trResultData): PTNewRunData | null => {
					const runCustomFields: Dictionary = {
						[`---f-${ptFieldTrResultId.id}`]: trResultData.attributes.id,
					};

					const customProps = pickBy(
						trResultData.attributes,
						(value, key) => key.startsWith('custom_') && value !== null,
					);

					for (const [propKey, propValue] of Object.entries(customProps)) {
						if (propValue === undefined) {
							continue;
						}

						const trCustomFieldData = trCustomFields.find(
							({ attributes: trCustomField }) => trCustomField.systemName.toLowerCase() === propKey.toLowerCase(),
						);
						const ptCustomFieldData = ptCustomFields.find(
							({ attributes: ptCustomField }) => ptCustomField.attributes.name.toLowerCase() === propKey.toLowerCase(),
						);

						if (!trCustomFieldData || !ptCustomFieldData) {
							continue;
						}

						const transformedValue = transformCustomFieldValue(
							propValue,
							ptCustomFieldData.attributes.attributes.fieldFormat,
							trCustomFieldData.attributes,
							trUsersData,
						);

						if (transformedValue !== null) {
							runCustomFields[`---f-${ptCustomFieldData.id}`] = transformedValue;
						}
					}

					const curPtInstance = trPtTestsMap.get(trResultData.attributes.testId);

					if (!curPtInstance) {
						return null;
					}

					const resultStepsMigrationData = this.getStepsForTrResult(trResultData, trPtTestsMap);

					const ptAssignedToId = trPtUserIdsMap.get(Number(trResultData.attributes.assignedToId));
					const fallbackUser = ptUsersData.find(
						({ attributes: ptUser }) => ptUser.attributes.email === this.fallbackUserEmail,
					);

					return {
						attributes: {
							instanceId: Number(curPtInstance?.id),
							// assignedToType: 'user', // is not described in api docs
							customFields: runCustomFields,
							runDate: formatISO(new Date(trResultData.attributes.createdOn * 1000)),
							runType: PTRunType.MANUAL_RUN,
							runDuration: convertDurationToHMS(trResultData.attributes.elapsed ?? ''),
							testerId: Number(ptAssignedToId ?? fallbackUser?.id) ?? null,
						},
						steps: {
							data: resultStepsMigrationData.map((stepData): PTRunStep => stepData.step),
						},
					};
				})
				.filter((instance) => instance !== null) as PTNewRunData[];

			await this.trDataService.update(
				curTrResultsDataChunk.map((trTestData) => ({ ...trTestData, migrationStatus: EntityMigrationStatus.PENDING })),
			);
			const { data: createdPtRuns } = await ptBulkCreateRuns(this.destinationProjectId, newResults);
			const newTrResultsData = curTrResultsDataChunk.map(
				(trResultData): TRData<TRResultDto> => ({
					...trResultData,
					migrationStatus: EntityMigrationStatus.MIGRATED,
					ptEntityId: createdPtRuns.find(
						(createdInstance) =>
							(
								createdInstance.attributes.customFields[`---f-${ptFieldTrResultId.id}`] as string | undefined
							)?.toString() === trResultData.id,
					)?.id,
				}),
			);

			await this.ptDataService.save(this.destinationProjectId, PTEntity.RUN, createdPtRuns);
			await this.trDataService.update(newTrResultsData);

			this.statisticsService.addProcessed(this.type, MigrationEntityStepStage.PUSH, 'tr_result', newTrResultsData.length);
			this.logger.progress.addProgress(curTrResultsDataChunk.length);
		});*/
	};

	private readonly getTrPtUserIdsMap = async (): Promise<Map<number, string>> => {
		const trUsersData = await this.trDataService.get<TRUserDto>(TREntity.USER);
		const trPtUserIdsMap = new Map<number, string>();

		trUsersData.forEach((trUserData) => {
			if (trUserData.ptEntityId) {
				trPtUserIdsMap.set(Number(trUserData.attributes.id), trUserData.ptEntityId);
			}
		});

		return trPtUserIdsMap;
	};

	private readonly getStepsForTrResult = (trResultData: TRData<TRResultDto>, trPtTestsMap: Map<number, PTData<PTInstanceDto>>, trTestsMap: Map<number, TRData<TRTestDto>>): PTRunStepMigration[] => {
		const stepsMigrationData: PTRunStepMigration[] = [];

		const ptInstance = trPtTestsMap.get(trResultData.attributes.testId);

		if (!ptInstance) {
			return [];
		}

		const trResultAttachments = trResultData.attributes.attachmentIds?.map((attachmentId) => attachmentId.toString()) ?? [];
		if (!trResultData.attributes.customStepResults || trResultData.attributes.customStepResults.length === 0) {
			const currentTest = trTestsMap.get(Number(trResultData.attributes.testId));
			const stepAttachmentIds: string[] = [];

			const [customStepsText, customStepsAttachments] = extractAttachmentsFromString(currentTest?.attributes.customSteps ?? '');
			const [customExpectedText, customExpectedAttachments] = extractAttachmentsFromString(currentTest?.attributes.customExpected ?? '');
			const [commentText, commentAttachments] = extractAttachmentsFromString(trResultData.attributes.comment ?? '');

			stepAttachmentIds.push(...customStepsAttachments, ...customExpectedAttachments, ...commentAttachments, ...trResultAttachments);

			stepsMigrationData.push({
				step: {
					name: 'Text',
					status: resultStatusesMap.get(Number(trResultData.attributes.statusId)) ?? TRResultStatusType.UNTESTED,
					actualResults: commentText,
					expectedResults: customExpectedText ?? '',
					description: customStepsText ?? ''
				}, trAttachmentIds: stepAttachmentIds
			});
		} else {
			trResultData.attributes.customStepResults.forEach((customStepResult, index) => {
				const stepAttachmentIds: string[] = [];

				const [customStepResultContentText, contentAttachments] = extractAttachmentsFromString(customStepResult.content ?? '');
				const [customStepResultExpectedText, expectedAttachments] = extractAttachmentsFromString(customStepResult.expected ?? '');
				const [customStepResultActualText, actualAttachments] = extractAttachmentsFromString(customStepResult.actual ?? '');

				stepAttachmentIds.push(...contentAttachments, ...expectedAttachments, ...actualAttachments, ...(index === 0 ? trResultAttachments : []));

				stepsMigrationData.push({
					step: {
						name: `Step ${stepsMigrationData.length + 1}`,
						description: customStepResultContentText,
						expectedResults: customStepResultExpectedText,
						actualResults: customStepResultActualText,
						status: resultStatusesMap.get(Number(customStepResult.statusId)) ?? TRResultStatusType.UNTESTED
					}, trAttachmentIds: stepAttachmentIds
				});
			});
		}

		return stepsMigrationData;
	};

	private readonly getTrTestsMap = async (): Promise<Map<number, TRData<TRTestDto>>> => {
		const trTestsData = await this.trDataService.get<TRTestDto>(TREntity.TEST);

		const trTestsMap = new Map<number, TRData<TRTestDto>>();
		trTestsData.forEach((trTestData) => {
			trTestsMap.set(trTestData.attributes.id, trTestData);
		});

		return trTestsMap;
	};

	private readonly getTrPtTestsMap = async (): Promise<Map<number, PTData<PTInstanceDto>>> => {
		const trTestsData = await this.trDataService.get<TRTestDto>(TREntity.TEST);
		const ptInstancesData = await this.ptDataService.get<PTInstanceDto>(PTEntity.INSTANCE);

		const ptInstancesMap = new Map<string, PTData<PTInstanceDto>>();
		ptInstancesData.forEach((ptInstanceData) => {
			ptInstancesMap.set(ptInstanceData.id, ptInstanceData);
		});

		const trPtInstancesMap = new Map<number, PTData<PTInstanceDto>>();
		trTestsData.forEach((trTestData) => {
			if (trTestData.ptEntityId) {
				const curInstance = ptInstancesMap.get(trTestData.ptEntityId);

				if (!curInstance) {
					return;
				}
				trPtInstancesMap.set(trTestData.attributes.id, curInstance);
			}
		});

		return trPtInstancesMap;
	};

	private readonly getTrPtResultIdsMap = async (): Promise<Map<number, string>> => {
		const ptRunsData = await this.ptDataService.get<PTRunDto>(PTEntity.RUN);
		const trPtResultIdsMap = new Map<number, string>();
		const ptCustomFields = await this.ptDataService.get<PTCustomFieldDto>(PTEntity.CUSTOM_FIELD);

		const ptFieldTrResultId = ptCustomFields.find(({ attributes: ptCustomField }) => ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_RESULT_ID.toLowerCase());

		if (!ptFieldTrResultId) {
			const errorMessage = `Custom field "${PTTestCustomFieldsList.TESTRAIL_RESULT_ID}" does not exist`;
			throw new Error(errorMessage);
		}

		ptRunsData.forEach(({ attributes: ptRun }) => {
			const customFields = ptRun.attributes.customFields as IPTCustomFields;

			const trResultId = customFields[`---f-${ptFieldTrResultId.id}`] as string | undefined;

			if (trResultId) {
				trPtResultIdsMap.set(Number(trResultId), ptRun.id);
			}
		});

		return trPtResultIdsMap;
	};

	private readonly fetchTRTestResultsPortion = async (portionSize?: number): Promise<boolean> => {
		const trRunsCount = await this.trDataService.countBy(TREntity.RUN, {
			projectId: this.sourceProjectId, isResultsFetched: false
		});
		const trRunData = await this.trDataService.findOne<TRRunDto>(TREntity.RUN, {
			projectId: this.sourceProjectId, isResultsFetched: false
		});

		if (!trRunData) {
			return false;
		}

		const hasMoreItems = await this.fetchTRTestsResultsByRunIdPortion(trRunData.id, portionSize);
		await this.trDataService.update([{ ...trRunData, isResultsFetched: !hasMoreItems }]);

		return trRunsCount > 1;
	};

	private readonly fetchTRTestsResultsByRunIdPortion = async (runId: string, portionSize?: number): Promise<boolean> => {
		const trGetResultsByRunId = this.trRateLimitService.throttle(this.trResultsApiService.getResultsByRunId);

		const trResultsCount = await this.trDataService.count(TREntity.RESULT, this.sourceProjectId, TREntity.RUN, runId);

		const pageSize = Math.min(250, portionSize ?? 250);
		let page = Math.ceil(trResultsCount / pageSize);
		let pulledItemsCount = 0;

		let hasMoreItems: boolean;
		let reachedPortionLimit: boolean;
		do {
			const response = await trGetResultsByRunId(Number(runId), IS_TESTRAIL_CLOUD_INSTANCE ? {
				pagination: {
					limit: pageSize, offset: pageSize * page
				}
			} : undefined);
			await this.trDataService.save(this.sourceProjectId, TREntity.RESULT, response.results, TREntity.RUN, runId);
			this.statisticsService.increaseProcessedEntitiesCount(MigrationEntityStep.RESULT, MigrationEntityStepStage.PULLING, 'tr_result', response?.results.length);
			page++;
			hasMoreItems = !!response?._links?.next;
			pulledItemsCount += response?.results?.length;
			reachedPortionLimit = !portionSize ? false : pulledItemsCount >= portionSize;
			// eslint-disable-next-line no-unmodified-loop-condition
		} while (IS_TESTRAIL_CLOUD_INSTANCE && hasMoreItems && !reachedPortionLimit);

		return hasMoreItems;
	};

	private readonly fetchPTRuns = async (): Promise<void> => {
		const ptGetRunsByProjectId = this.ptRateLimitService.throttle(this.ptRunsApiService.getRunsByProjectId);

		const ptRunsCount = await this.ptDataService.count(PTEntity.RUN, this.destinationProjectId);

		const pageSize = 250;
		let nextPage: number | null | undefined = Math.ceil(ptRunsCount / pageSize) + 1;
		while (nextPage) {
			const response = await ptGetRunsByProjectId(this.destinationProjectId, {
				pagination: {
					pageNumber: nextPage, pageSize
				}
			});
			await this.ptDataService.save(this.destinationProjectId, PTEntity.RUN, response.data);
			this.statisticsService.increaseProcessedEntitiesCount(MigrationEntityStep.RESULT, MigrationEntityStepStage.PULLING, 'pt_run', response.data.length);
			nextPage = response?.meta?.nextPage;
		}
	};
}
