import { Injectable } from '@nestjs/common';
import { pickBy } from 'lodash';

import { EntityMigrationService } from './entity-migration.service';

import {
	Dictionary, EntityMigrationStatus, MigrationAction, MigrationEntityStep, MigrationEntityStepStage, PTEntity, TREntity
} from 'src/core/types/migration';
import { TRCasesApiService, TRSectionsApiService, TRTemplatesApiService } from 'src/test-rail/data-services';
import { PTTestsApiService } from 'src/practi-test/data-services';
import { PTRateLimitService } from 'src/practi-test/http/pt-rate-limit.service';
import { TRRateLimitService } from 'src/test-rail/http/tr-rate-limit.service';
import { PTCustomFieldDto, PTTestCustomFieldsList } from 'src/practi-test/types/custom-field.dto';
import { TRCaseDto, TRCaseMigrationData } from 'src/test-rail/types/case.dto';
import { TRSectionDto } from 'src/test-rail/types/section.dto';
import { TRTemplateDto } from 'src/test-rail/types/template.dto';
import { PTTestDto, PTTestStep, PTTestStepMigrationData, PTTestTypes } from 'src/practi-test/types/test.dto';
import { TRUserDto } from 'src/test-rail/types/user.dto';
import { IPTCustomFields } from 'src/practi-test/types/general-types';
import { TRData } from 'src/core/db/entities/test-rail.entity';
import { PTUserDto } from 'src/practi-test/types/user.dto';
import { TRSharedStepsApiService } from 'src/test-rail/data-services/shared-steps-api.service';
import { TRSharedStepDto } from 'src/test-rail/types/shared-step.dto';
import { TRCustomFieldDto } from 'src/test-rail/types/custom-field.dto';
import { LoggingService } from 'src/core/logging/logging.service';
import { executeAllChunkedAsync } from 'src/core/utils/api.utils';
import { ConfigService } from '@nestjs/config';
import {
	IS_TESTRAIL_CLOUD_INSTANCE,
	MIGRATION_CHUNK_SIZE_MULTIPLIERS,
	MIGRATION_ENTITY_STEPS_ENV_MAP,
	MIGRATION_ENTITY_STEPS_SEQUENCE
} from 'src/migration/config/configuration';
import { transformCustomFieldValue } from 'src/migration/migration.utils';
import { IsNull } from 'typeorm';
import { IMigrationProcessInfo } from 'src/migration/types/migration-process-info.interface';
import { IAppConfig } from 'src/core/types/app.config';
import { ProjectSuiteMode } from 'src/test-rail/types/project.dto';
import { extractAttachmentsFromString } from 'src/migration/utils';

@Injectable()
export class CaseMigrationService extends EntityMigrationService {
	protected type = MigrationEntityStep.CASE;
	private currentSuiteIndex: number = 0;

	constructor(private readonly trCasesApiService: TRCasesApiService, private readonly trTemplatesApiService: TRTemplatesApiService, private readonly trSectionsApiService: TRSectionsApiService, private readonly trSharedStepsApiService: TRSharedStepsApiService, private readonly ptTestsApiService: PTTestsApiService, private readonly ptRateLimitService: PTRateLimitService, private readonly trRateLimitService: TRRateLimitService, private readonly configService: ConfigService<IAppConfig>, protected readonly logger: LoggingService) {
		super();
		logger.setContext(CaseMigrationService.name);
	}

	public getShouldExecuteEntityMigration = async (migrationProcess: IMigrationProcessInfo): Promise<boolean> => {
		if (migrationProcess.migratedEntitySteps.includes(MigrationEntityStep.CASE)) {
			return false;
		}

		const initialEntityIndex = MIGRATION_ENTITY_STEPS_SEQUENCE.indexOf(migrationProcess.initialEntityStep);
		const currentEntityIndex = MIGRATION_ENTITY_STEPS_SEQUENCE.indexOf(MigrationEntityStep.CASE);

		const requiredEntities: MigrationEntityStep[] = [MigrationEntityStep.USER];
		const isDependenciesMigrated = requiredEntities.every((i) => migrationProcess.migratedEntitySteps.includes(i));

		return (initialEntityIndex <= currentEntityIndex && !!MIGRATION_ENTITY_STEPS_ENV_MAP.get(MigrationEntityStep.CASE) && isDependenciesMigrated);
	};

	public pullAllRequiredData = async (): Promise<void> => {
		const promises: Promise<any>[] = [this.fetchTRTemplates(), this.fetchPTTests(), this.fetchTRSharedSteps()];

		if (this.suiteMode !== ProjectSuiteMode.MULTI_SUITE) {
			promises.push(this.fetchTRSections());
		} else {
			const sectionsPromises = this.sourceProjectSuites.map(async (suite) => this.fetchTRSections(suite.id));
			promises.push(...sectionsPromises);
		}

		await Promise.allSettled(promises);
	};

	public pullNextTrDataPortion = async (batchSize?: number): Promise<boolean> => {
		if (this.suiteMode !== ProjectSuiteMode.MULTI_SUITE) {
			return await this.fetchTRCasesPortion(batchSize);
		}

		const currentSuiteId = this.sourceProjectSuites[this.currentSuiteIndex]?.id;
		const hasMoreItems = await this.fetchTRCasesPortion(batchSize, currentSuiteId);

		if (!hasMoreItems) {
			if (this.currentSuiteIndex === this.sourceProjectSuites.length - 1) {
				return false;
			}

			this.currentSuiteIndex++;

			return true;
		}

		return hasMoreItems;
	};

	public compareAwaitingData = async (): Promise<void> => {
		const trCasesData = await this.trDataService.find<TRCaseDto>(TREntity.CASE, {
			projectId: this.sourceProjectId, migrationAction: IsNull()
		});
		const trSharedStepsData = await this.trDataService.get<TRSharedStepDto>(TREntity.SHARED_STEP);
		const trTemplatesData = await this.trDataService.get<TRTemplateDto>(TREntity.TEMPLATE);
		const trSectionsData = await this.trDataService.get<TRSectionDto>(TREntity.SECTION);
		const trUsersData = await this.trDataService.get<TRUserDto>(TREntity.USER);
		const ptTestsData = await this.ptDataService.get<PTTestDto>(PTEntity.TEST);
		const ptCustomFields = await this.ptDataService.get<PTCustomFieldDto>(PTEntity.CUSTOM_FIELD);

		const trTestCaseTextTemplate = trTemplatesData.find(({ attributes: trTemplate }) => ['Test Case (Text)', 'Test Case'].includes(trTemplate.name));

		const trTestCaseStepsTemplate = trTemplatesData.find(({ attributes: trTemplate }) => ['Test Case (Steps)', 'Test Case + Step Results'].includes(trTemplate.name));

		const ptFieldTrCaseId = ptCustomFields.find(({ attributes: ptCustomField }) => ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_CASE_ID.toLowerCase());
		const ptFieldTrSection = ptCustomFields.find(({ attributes: ptCustomField }) => ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_SECTION.toLowerCase());

		// prevent migration if TR reference custom field does not exist
		if (!ptFieldTrCaseId || !ptFieldTrSection) {
			const errorMessage = `Custom field${!ptFieldTrCaseId && !ptFieldTrSection ? `s "${PTTestCustomFieldsList.TESTRAIL_CASE_ID}" and "${PTTestCustomFieldsList.TESTRAIL_SECTION}" do` : ` "${!ptFieldTrCaseId ? PTTestCustomFieldsList.TESTRAIL_CASE_ID : PTTestCustomFieldsList.TESTRAIL_SECTION}" does`} not exist`;
			throw new Error(errorMessage);
		}

		const trPtTestIdsMap = new Map<string, string>();

		ptTestsData.forEach(({ attributes: ptTest }) => {
			const customFields = ptTest.attributes.customFields as IPTCustomFields;

			const trCaseId = customFields[`---f-${ptFieldTrCaseId.id}`] as string | undefined;

			if (trCaseId) {
				trPtTestIdsMap.set(trCaseId, ptTest.id);
			}
		});

		const trPtUserIdsMap = new Map<number, string>();

		trUsersData.forEach((trUserData) => {
			if (trUserData.ptEntityId) {
				trPtUserIdsMap.set(trUserData.attributes.id, trUserData.ptEntityId);
			}
		});

		const sectionsMap = new Map<number, TRSectionDto>();

		trSectionsData.forEach(({ attributes: trSection }) => {
			sectionsMap.set(trSection.id, trSection);
		});

		const sectionPathsMap = new Map<number, string>();

		const getParentSection = (id?: number): string[] => {
			if (!id) {
				return [];
			}
			const node = sectionsMap.get(id);

			return node ? [...getParentSection(node?.parentId), node.name] : [];
		};
		trSectionsData.forEach((trSectionData) => {
			sectionPathsMap.set(trSectionData.attributes.id, getParentSection(trSectionData.attributes.id).join('/'));
		});

		const addProcessedCaseStats = (): void => {
			this.statisticsService.increaseProcessedEntitiesCount(this.type, MigrationEntityStepStage.COMPARING, 'tr_case', 1);
		};

		const newTrCasesData = trCasesData.map((trCaseData): TRData<TRCaseDto> => {
			const trCase = trCaseData.attributes;
			const ptAuthorId = trPtUserIdsMap.get(trCase.createdBy);
			const ptTestId = trPtTestIdsMap.get(trCase.id.toString());

			if ((ptTestId ?? trCase.isDeleted) ?? !(trCase.templateId === trTestCaseTextTemplate?.attributes.id || trCase.templateId === trTestCaseStepsTemplate?.attributes.id)) {
				addProcessedCaseStats();

				return {
					...trCaseData, ptEntityId: ptTestId, migrationAction: MigrationAction.IGNORE
				};
			}

			trCaseData.migrationData = {
				...trCaseData.migrationData,
				sectionPath: sectionPathsMap.get(trCase.sectionId),
				ptAuthorId: Number(ptAuthorId) || null
			};

			const stepsMigrationData: PTTestStepMigrationData[] = [];

			if (trCase.templateId === trTestCaseTextTemplate?.attributes.id) {
				stepsMigrationData.push({
					step: {
						name: 'Step 1', description: trCase.customSteps ?? '', expectedResults: trCase.customExpected ?? ''
					}, trAttachmentIds: []
				});
			} else if (trCase.templateId === trTestCaseStepsTemplate?.attributes.id && trCase.customStepsSeparated) {
				trCase.customStepsSeparated.forEach((customStep) => {
					const stepAttachmentIds: string[] = [];

					if (customStep.sharedStepId) {
						const trSharedStep = trSharedStepsData.find((trSharedStep) => trSharedStep.id === customStep.sharedStepId?.toString());

						if (trSharedStep) {
							const stepsDataArray = trSharedStep.attributes.customStepsSeparated?.map((customStepSeparated): PTTestStepMigrationData => ({
								step: {
									name: `Step ${stepsMigrationData.length + 1}`,
									description: customStepSeparated.content,
									expectedResults: customStepSeparated.expected
								}, trAttachmentIds: stepAttachmentIds
							}));

							return stepsMigrationData.push(...stepsDataArray);
						}
					}

					const [customStepContentText, customStepContentAttachments] = extractAttachmentsFromString(customStep.content ?? '');
					const [customStepExpectedText, customStepExpectedAttachments] = extractAttachmentsFromString(customStep.expected ?? '');
					stepAttachmentIds.push(...customStepContentAttachments, ...customStepExpectedAttachments);

					return stepsMigrationData.push({
						step: {
							name: `Step ${stepsMigrationData.length + 1}`,
							description: customStepContentText,
							expectedResults: customStepExpectedText
						}, trAttachmentIds: stepAttachmentIds
					});
				});
			}
			addProcessedCaseStats();

			return {
				...trCaseData, attributes: trCase, migrationAction: MigrationAction.INSERT, migrationData: {
					...(trCaseData.migrationData as TRCaseMigrationData), stepsData: stepsMigrationData
				}
			};
		});

		await this.trDataService.update(newTrCasesData);
	};

	public verifyPreviouslyUnfinishedData = async (): Promise<void> => {
		const trCasesData = await this.trDataService.find<TRCaseDto>(TREntity.CASE, {
			projectId: this.sourceProjectId, migrationStatus: EntityMigrationStatus.PENDING
		});

		const ptGetTestsByProjectId = this.ptRateLimitService.throttle(this.ptTestsApiService.getTestsByProjectId);

		for (const trCaseData of trCasesData) {
			const data: PTTestDto[] = [];
			const pageSize = 250;
			let nextPage: number | null | undefined = 1;
			while (nextPage) {
				const response = await ptGetTestsByProjectId(this.destinationProjectId, {
					filters: {
						nameExact: trCaseData.attributes.title
					}, pagination: {
						pageNumber: nextPage, pageSize
					}
				});

				data.push(...response.data);
				nextPage = response?.meta?.nextPage;
			}

			if (data.length > 0) {
				const ptCustomFields = await this.ptDataService.get<PTCustomFieldDto>(PTEntity.CUSTOM_FIELD);

				const ptFieldTrCaseId = ptCustomFields.find(({ attributes: ptCustomField }: {
					attributes: PTCustomFieldDto
				}) => ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_CASE_ID.toLowerCase());

				const ptEntity = data.find((ptTest) => ptTest.attributes.customFields[`---f-${ptFieldTrCaseId?.id}`] === trCaseData.id);

				if (ptEntity) {
					await this.trDataService.update([{
						...trCaseData, migrationStatus: EntityMigrationStatus.MIGRATED, ptEntityId: ptEntity.id
					}]);

					continue;
				}
			}

			await this.trDataService.update([{ ...trCaseData, migrationStatus: EntityMigrationStatus.NOT_MIGRATED }]);
		}
	};

	public pushData = async (): Promise<void> => {
		const trCasesData = await this.trDataService.find<TRCaseDto>(TREntity.CASE, {
			projectId: this.sourceProjectId,
			migrationAction: MigrationAction.INSERT,
			migrationStatus: EntityMigrationStatus.NOT_MIGRATED
		});

		const ptCustomFields = await this.ptDataService.get<PTCustomFieldDto>(PTEntity.CUSTOM_FIELD);
		const ptUsersData = await this.ptDataService.get<PTUserDto>(PTEntity.USER);
		const trCustomFields = await this.trDataService.get<TRCustomFieldDto>(TREntity.CASE_CUSTOM_FIELD);
		const trUsersData = await this.trDataService.get<TRUserDto>(TREntity.USER);

		const ptCreateTest = this.ptRateLimitService.throttle(this.ptTestsApiService.createTest);

		const ptFieldTrCaseId = ptCustomFields.find(({ attributes: ptCustomField }: {
			attributes: PTCustomFieldDto
		}) => ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_CASE_ID.toLowerCase());

		const ptFieldTrSection = ptCustomFields.find(({ attributes: ptCustomField }: {
			attributes: PTCustomFieldDto
		}) => ptCustomField.attributes.name.toLowerCase() === PTTestCustomFieldsList.TESTRAIL_SECTION.toLowerCase());

		if (!ptFieldTrCaseId || !ptFieldTrSection) {
			return;
		}

		const fallbackUser = ptUsersData.find(({ attributes: ptUser }) => ptUser.attributes.email === this.fallbackUserEmail);

		this.logger.progress.setTotal(trCasesData.length);
		this.logger.progress.setProgress(0);
		this.logger.progress.setBarVisible(true);

		const chunkSize = this.configService.get('ENABLE_CHUNKED_PUSH', 'false') === 'true' ? Math.ceil(+this.configService.get('PRACTITEST_API_LIMIT', 100) * MIGRATION_CHUNK_SIZE_MULTIPLIERS.CASES) : 1;

		await executeAllChunkedAsync(trCasesData, chunkSize, async (trCaseData) => {
			const trCase = trCaseData.attributes;
			const caseMigrationData = trCaseData.migrationData as TRCaseMigrationData;

			const customProps = pickBy(trCase, (value, key) => key.startsWith('custom_') && value !== null);

			const testCustomFields: Dictionary = {
				[`---f-${ptFieldTrCaseId.id}`]: trCase.id, [`---f-${ptFieldTrSection.id}`]: caseMigrationData.sectionPath
			};

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
					testCustomFields[`---f-${ptCustomFieldData.id}`] = transformedValue;
				}
			}

			await this.trDataService.update([{ ...trCaseData, migrationStatus: EntityMigrationStatus.PENDING }]);

			try {
				const { data: createdPtTest } = await ptCreateTest(this.destinationProjectId, {
					attributes: {
						name: trCase.title,
						authorId: !caseMigrationData.ptAuthorId ? Number(fallbackUser?.id) : caseMigrationData.ptAuthorId,
						testType: PTTestTypes.SCRIPTED_TEST,
						customFields: testCustomFields
					}, steps: { data: caseMigrationData.stepsData.map((stepData): PTTestStep => stepData.step) }
				});

				await this.ptDataService.save(this.destinationProjectId, PTEntity.TEST, [createdPtTest]);
				await this.trDataService.update([{
					...trCaseData, ptEntityId: createdPtTest.id, migrationStatus: EntityMigrationStatus.MIGRATED
				}]);

				this.statisticsService.increaseProcessedEntitiesCount(this.type, MigrationEntityStepStage.PUSHING, 'tr_case', 1);
			} catch (error: any) {
				this.statisticsService.increaseFailedEntitiesCount(this.type, MigrationEntityStepStage.PUSHING, 'tr_case', 1);
				trCaseData.errors.push(error.message);
				await this.trDataService.update([{ ...trCaseData, migrationStatus: EntityMigrationStatus.FAILED }]);
			} finally {
				this.logger.progress.addProgress(1);
			}
		});
	};

	private readonly fetchPTTests = async (): Promise<void> => {
		const ptGetTestsByProjectId = this.ptRateLimitService.throttle(this.ptTestsApiService.getTestsByProjectId);
		const ptTestsCount = await this.ptDataService.count(PTEntity.TEST, this.destinationProjectId);

		const pageSize = 250;
		let nextPage: number | null | undefined = Math.ceil(ptTestsCount / pageSize) + 1;
		while (nextPage) {
			const response = await ptGetTestsByProjectId(this.destinationProjectId, {
				pagination: {
					pageNumber: nextPage, pageSize
				}
			});
			await this.ptDataService.save(this.destinationProjectId, PTEntity.TEST, response.data);
			this.statisticsService.increaseProcessedEntitiesCount(this.type, MigrationEntityStepStage.PULLING, 'pt_test', response.data.length);
			nextPage = response?.meta?.nextPage;
		}
	};

	private readonly fetchTRCasesPortion = async (portionSize?: number, suiteId?: number): Promise<boolean> => {
		const trGetCasesByProjectIdAndSuiteId = this.trRateLimitService.throttle(this.trCasesApiService.getCasesByProjectIdAndSuiteId);

		const trCasesCount = await this.trDataService.countBy(TREntity.CASE, { projectId: this.sourceProjectId, suiteId });

		const pageSize = Math.min(250, portionSize ?? 250);
		let page = Math.ceil(trCasesCount / pageSize);
		let pulledItemsCount = 0;

		let hasMoreItems: boolean;
		let reachedPortionLimit: boolean;
		do {
			const response = await trGetCasesByProjectIdAndSuiteId(this.sourceProjectId, suiteId, IS_TESTRAIL_CLOUD_INSTANCE ? {
				pagination: {
					limit: pageSize, offset: pageSize * page
				}
			} : undefined);
			await this.trDataService.save(this.sourceProjectId, TREntity.CASE, response.cases, undefined, undefined, suiteId);
			this.statisticsService.increaseProcessedEntitiesCount(this.type, MigrationEntityStepStage.PULLING, 'tr_case', response.cases.length);

			page++;
			hasMoreItems = !!response?._links?.next;
			pulledItemsCount += response?.cases?.length;
			reachedPortionLimit = !portionSize ? false : pulledItemsCount >= portionSize;
			// eslint-disable-next-line no-unmodified-loop-condition
		} while (IS_TESTRAIL_CLOUD_INSTANCE && hasMoreItems && !reachedPortionLimit);

		return hasMoreItems;
	};

	private readonly fetchTRSections = async (suiteId?: number): Promise<void> => {
		const trGetSectionsByProjectIdAndSuiteId = this.trRateLimitService.throttle(this.trSectionsApiService.getSectionsByProjectIdAndSuiteId);
		const trSectionsCount = await this.trDataService.count(TREntity.SECTION, this.sourceProjectId);

		const limit = 250;
		let page = Math.ceil(trSectionsCount / limit);
		let next: string | null | undefined;
		do {
			const response = await trGetSectionsByProjectIdAndSuiteId(this.sourceProjectId, suiteId, IS_TESTRAIL_CLOUD_INSTANCE ? {
				pagination: {
					limit, offset: limit * page
				}
			} : undefined);
			await this.trDataService.save(this.sourceProjectId, TREntity.SECTION, response.sections);
			this.statisticsService.increaseProcessedEntitiesCount(this.type, MigrationEntityStepStage.PULLING, 'tr_section', response?.sections.length);

			next = response?._links?.next;
			page++;
			// eslint-disable-next-line no-unmodified-loop-condition
		} while (IS_TESTRAIL_CLOUD_INSTANCE && next);
	};

	private readonly fetchTRTemplates = async (): Promise<void> => {
		const trTemplatesCount = await this.trDataService.count(TREntity.TEMPLATE, this.sourceProjectId);

		if (trTemplatesCount > 0) {
			return;
		}

		const trGetTemplatesByProjectId = this.trRateLimitService.throttle(this.trTemplatesApiService.getTemplatesByProjectId);
		const trTemplates = await trGetTemplatesByProjectId(this.sourceProjectId);

		await this.trDataService.save(this.sourceProjectId, TREntity.TEMPLATE, trTemplates);

		this.statisticsService.setProcessedEntitiesCount(this.type, MigrationEntityStepStage.PULLING, 'tr_template', trTemplates.length);
	};

	private readonly fetchTRSharedSteps = async (): Promise<void> => {
		const trGetSharedStepsByProjectId = this.trRateLimitService.throttle(this.trSharedStepsApiService.getSharedStepsByProjectId);
		const trSharedStepsCount = await this.trDataService.count(TREntity.SHARED_STEP, this.sourceProjectId);

		const limit = 250;
		let page = Math.ceil(trSharedStepsCount / limit);
		let next: string | null | undefined;
		do {
			const response = await trGetSharedStepsByProjectId(this.sourceProjectId, IS_TESTRAIL_CLOUD_INSTANCE ? {
				pagination: {
					limit, offset: limit * page
				}
			} : undefined);
			await this.trDataService.save(this.sourceProjectId, TREntity.SHARED_STEP, response.sharedSteps);
			this.statisticsService.increaseProcessedEntitiesCount(this.type, MigrationEntityStepStage.PULLING, 'tr_shared_step', response?.sharedSteps.length);

			next = response?._links?.next;
			page++;
			// eslint-disable-next-line no-unmodified-loop-condition
		} while (IS_TESTRAIL_CLOUD_INSTANCE && next);
	};
}
