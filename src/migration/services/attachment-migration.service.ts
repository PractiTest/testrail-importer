import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { IsNull, Not } from 'typeorm';

import { EntityMigrationService } from './entity-migration.service';

import {
	EntityMigrationStatus,
	MigrationAction,
	MigrationEntityStep,
	MigrationEntityStepStage,
	PTEntity,
	TREntity,
	trPtEntitiesMap,
} from 'src/core/types/migration';
import { TRAttachmentsApiService } from 'src/test-rail/data-services';
import { PTAttachmentsApiService, PTRunsApiService } from 'src/practi-test/data-services';
import { executeAllChunkedAsync } from 'src/core/utils/api.utils';
import { TRAttachmentDto } from 'src/test-rail/types/attachment.dto';
import { TRData } from 'src/core/db/entities/test-rail.entity';
import { PTRateLimitService } from 'src/practi-test/http/pt-rate-limit.service';
import { TRRateLimitService } from 'src/test-rail/http/tr-rate-limit.service';
import { TRCaseDto } from 'src/test-rail/types/case.dto';
import { PTTestDto } from 'src/practi-test/types/test.dto';
import { PTData } from 'src/core/db/entities/practi-test.entity';
import { PTAttachmentDto, PTAttachmentEntities, TRAttachmentEntitiesMap } from 'src/practi-test/types/attachment.dto';
import { PTFile } from 'src/practi-test/types/file.dto';
import { LoggingService } from 'src/core/logging/logging.service';
import { TRResultDto } from 'src/test-rail/types/result.dto';
import { PTRunStepsMigrationData } from 'src/practi-test/types/run.dto';
import { PTStepRunDto } from 'src/practi-test/types/step-run.dto';
import { IMigrationProcessInfo } from 'src/migration/types/migration-process-info.interface';
import {
	IS_TESTRAIL_CLOUD_INSTANCE,
	MIGRATION_ENTITY_STEPS_ENV_MAP,
	MIGRATION_ENTITY_STEPS_SEQUENCE
} from 'src/migration/config/configuration';
import { IAppConfig } from 'src/core/types/app.config';

@Injectable()
export class AttachmentMigrationService extends EntityMigrationService {
	protected type = MigrationEntityStep.ATTACHMENT;
	private readonly migratedEntitySteps: MigrationEntityStep[] = [];

	constructor(
		private readonly trAttachmentApiService: TRAttachmentsApiService,
		private readonly ptAttachmentsApiService: PTAttachmentsApiService,
		private readonly ptRunsApiService: PTRunsApiService,
		private readonly trRateLimitService: TRRateLimitService,
		private readonly ptRateLimitService: PTRateLimitService,
		private readonly configService: ConfigService<IAppConfig>,
		protected readonly logger: LoggingService,
	) {
		super();
		this.logger.setContext(AttachmentMigrationService.name);
	}

	public getShouldExecuteEntityMigration = async (migrationProcess: IMigrationProcessInfo): Promise<boolean> => {
		const initialEntityIndex = MIGRATION_ENTITY_STEPS_SEQUENCE.indexOf(migrationProcess.initialEntityStep);
		const currentEntityIndex = MIGRATION_ENTITY_STEPS_SEQUENCE.indexOf(MigrationEntityStep.ATTACHMENT);

		const requiredEntities: MigrationEntityStep[] = [MigrationEntityStep.CASE, MigrationEntityStep.RESULT];
		const isSomeDependenciesMigrated = requiredEntities.some((i) => migrationProcess.migratedEntitySteps.includes(i));

		this.migratedEntitySteps.push(...migrationProcess.migratedEntitySteps);

		return (
			initialEntityIndex <= currentEntityIndex &&
			!!MIGRATION_ENTITY_STEPS_ENV_MAP.get(MigrationEntityStep.ATTACHMENT) &&
			isSomeDependenciesMigrated
		);
	};

	public pullAllRequiredData = async (): Promise<void> => {
		const promises: Promise<any>[] = [];

		if (this.migratedEntitySteps.includes(MigrationEntityStep.CASE)) {
			promises.push(this.fetchPTTestsAttachmentsList());
		}

		if (this.migratedEntitySteps.includes(MigrationEntityStep.RESULT)) {
			promises.push(this.fetchPTStepRuns());
		}

		await Promise.all(promises);
	};

	public pullNextTrDataPortion = async (batchSize?: number): Promise<boolean> => {
		const hasMoreCaseAttachments = await this.fetchTRCaseAttachmentsListPortion(batchSize);

		if (hasMoreCaseAttachments) {
			return true;
		}

		const hasMoreResultAttachments = await this.markupTRResultsForAttachmentsMigration(batchSize);

		return hasMoreCaseAttachments || hasMoreResultAttachments;
	};

	public compareAwaitingData = async (): Promise<void> => {
		if (this.migratedEntitySteps.includes(MigrationEntityStep.CASE)) {
			await this.compareTRAttachments(TREntity.CASE);
		}
	};

	public verifyPreviouslyUnfinishedData = async (): Promise<void> => {
		const trAttachmentsData = await this.trDataService.find<TRAttachmentDto>(
			TREntity.ATTACHMENT,
			{
				projectId: this.sourceProjectId,
				migrationStatus: EntityMigrationStatus.PENDING,
			},
			{
				parent: true,
			},
		);

		const ptGetAttachmentsForEntity = this.ptRateLimitService.throttle(
			this.ptAttachmentsApiService.getAttachmentsForEntity,
		);

		const ptEntityAttachmentsMap = new Map<string, PTAttachmentDto[]>();

		for (const trAttachment of trAttachmentsData) {
			const ptEntityType = trPtEntitiesMap.get(trAttachment.parent.type);

			if (!ptEntityType || !trAttachment?.parent?.ptEntityId) {
				continue;
			}

			if (!ptEntityAttachmentsMap.has(trAttachment.parent.ptEntityId)) {
				const data: PTAttachmentDto[] = [];
				const pageSize = 250;
				let nextPage: number | null | undefined = 1;
				while (nextPage) {
					const response = await ptGetAttachmentsForEntity(
						this.destinationProjectId,
						ptEntityType,
						Number(trAttachment.parent.ptEntityId),
						{
							pagination: {
								pageNumber: nextPage,
								pageSize,
							},
						},
					);

					data.push(...response.data);
					nextPage = response?.meta?.nextPage;
				}

				ptEntityAttachmentsMap.set(trAttachment.parent.ptEntityId, data);
			}

			const curAttachments = ptEntityAttachmentsMap.get(trAttachment.parent.ptEntityId);

			if (curAttachments && curAttachments.length > 0) {
				const firstEntity = curAttachments.find(
					(ptAttachment) =>
						ptAttachment.attributes.name === trAttachment.attributes.name &&
						ptAttachment.attributes.size === trAttachment.attributes.size,
				);

				if (firstEntity) {
					await this.trDataService.update([
						{ ...trAttachment, migrationStatus: EntityMigrationStatus.MIGRATED, ptEntityId: firstEntity.id },
					]);

					continue;
				}
			}

			await this.trDataService.update([{ ...trAttachment, migrationStatus: EntityMigrationStatus.NOT_MIGRATED }]);
		}
	};

	public pushData = async (): Promise<void> => {
		await this.pushAllAttachments();

		if (this.migratedEntitySteps.includes(MigrationEntityStep.RESULT)) {
			await this.pushTrResultAttachments();
		}
	};

	private readonly pushTrResultAttachments = async (): Promise<void> => {
		this.logger.progress.setTotal(0);

		const trResultsData = await this.trDataService.find<TRResultDto>(
			TREntity.RESULT,
			{
				projectId: this.sourceProjectId,
				migrationStatus: EntityMigrationStatus.MIGRATED,
				migrationAction: MigrationAction.MIGRATE_ATTACHMENTS,
			},
			{
				parent: true,
			},
		);

		const ptRunStepsData = await this.ptDataService.find<PTStepRunDto>(PTEntity.STEP_RUN, {
			projectId: this.destinationProjectId,
		});

		const ptCreateAttachmentsForEntity = this.ptRateLimitService.throttle(
			this.ptAttachmentsApiService.createAttachmentsForEntity,
		);

		const ptRunStepsMap = new Map<string, PTData<PTStepRunDto>[]>();

		for (const ptStepRunData of ptRunStepsData) {
			const curRuns: PTData<PTStepRunDto>[] =
				ptRunStepsMap.get(ptStepRunData.attributes.attributes.runId.toString()) ?? [];

			curRuns.push(ptStepRunData);
			ptRunStepsMap.set(ptStepRunData.attributes.attributes.runId.toString(), curRuns);
		}

		const failedTrResultsData: TRData<TRResultDto>[] = [];

		const mappedResultsWithAttachments: TRData<TRResultDto>[] = [];

		for (const trResultData of trResultsData) {
			const trResultStepMigrationData = trResultData.migrationData as PTRunStepsMigrationData;

			if (!Array.isArray(trResultStepMigrationData?.data)) {
				continue;
			}

			if (trResultData.parent?.errors?.length > 0) {
				trResultData.errors.push(...trResultData.parent.errors);
			}

			if (!trResultData.parent.ptEntityId) {
				trResultData.errors.push(`Parent ${trResultData.parentType} does not have corresponding PractiTest entity`);
			}

			if (!trResultData.ptEntityId) {
				trResultData.errors.push(`${trResultData.parentType} does not have corresponding PractiTest entity`);
			}

			if (trResultData.errors.length > 0) {
				trResultData.migrationStatus = EntityMigrationStatus.FAILED;
				failedTrResultsData.push(trResultData);

				continue;
			}

			const countAttachments = trResultStepMigrationData.data.reduce((acc, trResultStep) => {
				acc += trResultStep.trAttachmentIds.length;

				return acc;
			}, 0);

			this.logger.progress.addTotal(countAttachments);

			if (countAttachments === 0) {
				continue;
			}

			mappedResultsWithAttachments.push(trResultData);
		}

		this.logger.progress.setBarVisible(true);

		for (const trResultData of mappedResultsWithAttachments) {
			const trResultStepMigrationData = trResultData.migrationData as PTRunStepsMigrationData;

			const ptRunSteps = ptRunStepsMap.get(trResultData.ptEntityId ?? '');

			for (const trResultStep of trResultStepMigrationData.data) {
				const curPtRunStep = ptRunSteps?.find(
					(ptRunStep) => ptRunStep.attributes.attributes.name === trResultStep.step.name,
				);

				if (!ptRunSteps || !curPtRunStep) {
					continue;
				}

				const filesArr: PTFile[] = [];

				for (const trAttachmentId of trResultStep.trAttachmentIds) {
					try {
						const file = await this.fetchEncodedAttachmentWithDetails(trAttachmentId);
						filesArr.push(file);
					} catch (e) {
						this.statisticsService.increaseFailedEntitiesCount(
							this.type,
							MigrationEntityStepStage.PUSHING,
							'tr_attachment',
							1,
						);
					}
				}

				if (filesArr.length === 0) {
					continue;
				}

				const { data: createdPtAttachments } = await ptCreateAttachmentsForEntity(this.destinationProjectId, {
					entityId: Number(curPtRunStep.id),
					entity: PTAttachmentEntities.STEP_RUN,
					data: {
						type: 'attachments',
						files: {
							data: instanceToPlain(plainToInstance(PTFile, filesArr, { ignoreDecorators: true })) as PTFile[],
						},
					},
				});
				this.statisticsService.increaseProcessedEntitiesCount(
					this.type,
					MigrationEntityStepStage.PUSHING,
					'tr_attachment',
					createdPtAttachments.length,
				);
				this.logger.progress.addProgress(createdPtAttachments.length);
			}
			await this.trDataService.update([
				{ ...trResultData, migrationStatus: EntityMigrationStatus.MIGRATED_ATTACHMENTS },
			]);
		}
	};

	private readonly pushAllAttachments = async (): Promise<void> => {
		const trAttachmentsCount = await this.trDataService.countBy(
			TREntity.ATTACHMENT,
			{
				projectId: this.sourceProjectId,
				parentType: TREntity.CASE,
				migrationAction: Not(MigrationAction.IGNORE),
				migrationStatus: EntityMigrationStatus.NOT_MIGRATED,
			},
			{ parent: true },
		);
		this.logger.progress.setTotal(trAttachmentsCount);
		this.logger.progress.setBarVisible(true);

		const failedTrAttachmentsData: TRData<TRAttachmentDto>[] = [];
		const trAttachmentsData = (
			await this.trDataService.find<TRAttachmentDto>(
				TREntity.ATTACHMENT,
				{
					projectId: this.sourceProjectId,
					migrationAction: Not(MigrationAction.IGNORE),
					migrationStatus: EntityMigrationStatus.NOT_MIGRATED,
				},
				{ parent: true },
			)
		).filter((trAttachmentData) => {
			if (trAttachmentData.parent.errors.length > 0) {
				trAttachmentData.errors.push(...trAttachmentData.parent.errors);
			}

			if (!trAttachmentData.parent.ptEntityId) {
				trAttachmentData.errors.push(`Parent ${trAttachmentData.parentType} does not have corresponding PractiTest entity`);
			}

			if (trAttachmentData.errors.length > 0) {
				trAttachmentData.migrationStatus = EntityMigrationStatus.FAILED;
				failedTrAttachmentsData.push(trAttachmentData);

				return false;
			}

			return true;
		});

		this.statisticsService.increaseFailedEntitiesCount(
			this.type,
			MigrationEntityStepStage.PUSHING,
			'tr_attachment',
			failedTrAttachmentsData.length,
		);
		this.logger.progress.setProgress(failedTrAttachmentsData.length);

		await this.trDataService.update(failedTrAttachmentsData);

		const trEntityAttachmentsMap = new Map<
			string,
			{ entityType?: TREntity; attachmentsArr: TRData<TRAttachmentDto>[] }
		>();

		trAttachmentsData.forEach((trAttachmentData) => {
			if (!trAttachmentData.parent.ptEntityId) {
				return;
			}

			const entityData = trEntityAttachmentsMap.get(trAttachmentData.parent.ptEntityId) ?? {
				entityType: trAttachmentData.parentType,
				attachmentsArr: [] as TRData<TRAttachmentDto>[],
			};

			entityData.attachmentsArr.push(trAttachmentData);
			trEntityAttachmentsMap.set(trAttachmentData.parent.ptEntityId, entityData);
		});

		for (const [ptEntityId, entityData] of trEntityAttachmentsMap.entries()) {
			if (!entityData.entityType) {
				continue;
			}
			const entity = TRAttachmentEntitiesMap.get(entityData.entityType);

			if (!entity) {
				continue;
			}

			await this.pushAttachments(Number(ptEntityId), entity, entityData.attachmentsArr);
		}
	};

	private readonly pushAttachments = async (
		entityId: number,
		entity: PTAttachmentEntities,
		attachmentsArr: TRData<TRAttachmentDto>[],
	): Promise<void> => {
		const ptCreateAttachmentsForEntity = this.ptRateLimitService.throttle(
			this.ptAttachmentsApiService.createAttachmentsForEntity,
		);

		const filesArr = [] as PTFile[];

		for (const attachmentData of attachmentsArr) {
			const encodedFile = await this.fetchEncodedAttachment(attachmentData.id);
			filesArr.push({ filename: attachmentData.attributes.filename ?? 'file', contentEncoded: encodedFile });
		}

		await this.trDataService.update(
			attachmentsArr.map((trAttachmentData) => ({
				...trAttachmentData,
				migrationStatus: EntityMigrationStatus.PENDING,
			})),
		);
		const { data: createdPtAttachments } = await ptCreateAttachmentsForEntity(this.destinationProjectId, {
			entityId,
			entity,
			data: {
				type: 'attachments',
				files: {
					data: instanceToPlain(plainToInstance(PTFile, filesArr, { ignoreDecorators: true })) as PTFile[],
				},
			},
		});
		await this.trDataService.update(
			attachmentsArr.map((trAttachmentData) => ({
				...trAttachmentData,
				ptEntityId: createdPtAttachments.find(
					(ptAttachment) =>
						ptAttachment.attributes.name === trAttachmentData.attributes.filename &&
						ptAttachment.attributes.size === trAttachmentData.attributes.size,
				),
				migrationStatus: EntityMigrationStatus.MIGRATED,
			})),
		);

		this.statisticsService.increaseProcessedEntitiesCount(
			this.type,
			MigrationEntityStepStage.PUSHING,
			'tr_attachment',
			createdPtAttachments.length,
		);

		this.logger.progress.addProgress(createdPtAttachments.length);
	};

	private readonly compareTRAttachments = async (trEntity: TREntity): Promise<void> => {
		const trAttachmentsData = await this.trDataService.find<TRAttachmentDto>(TREntity.ATTACHMENT, {
			projectId: this.sourceProjectId,
			migrationAction: IsNull(),
			parentType: trEntity
		});

		const ptAttachmentsData = await this.ptDataService.get<PTAttachmentDto>(
			PTEntity.ATTACHMENT,
			this.destinationProjectId,
			trPtEntitiesMap.get(trEntity),
		);

		const ptAttachmentsMap = new Map<string, PTData<PTAttachmentDto>>();
		ptAttachmentsData.forEach((ptAttachmentData) => {
			const ptAttachment = ptAttachmentData.attributes;
			const attachmentKey = `${ptAttachment.attributes.name}_${ptAttachment.attributes.size}`;

			ptAttachmentsMap.set(attachmentKey, ptAttachmentData);
		});

		const trNewAttachmentsData = trAttachmentsData.map((trAttachmentData) => {
			const attachmentKey = `${trAttachmentData.attributes.name}_${trAttachmentData.attributes.size}`;
			const ptAttachmentData = ptAttachmentsMap.get(attachmentKey);

			trAttachmentData.migrationAction = MigrationAction.INSERT;

			if (ptAttachmentData) {
				trAttachmentData.ptEntityId = ptAttachmentData.id;
				trAttachmentData.migrationAction = MigrationAction.IGNORE;
			}

			return trAttachmentData;
		});

		await this.trDataService.update(trNewAttachmentsData);

		this.statisticsService.increaseProcessedEntitiesCount(
			this.type,
			MigrationEntityStepStage.COMPARING,
			'tr_attachment',
			trNewAttachmentsData.length,
		);
	};

	private readonly markupTRResultsForAttachmentsMigration = async (portionSize?: number): Promise<boolean> => {
		const trCasesCount = await this.trDataService.countBy(TREntity.RESULT, {
			projectId: this.sourceProjectId,
			migrationStatus: EntityMigrationStatus.MIGRATED,
		});
		const trResultsData = await this.trDataService.find<TRResultDto>(
			TREntity.RESULT,
			{
				projectId: this.sourceProjectId,
				migrationStatus: EntityMigrationStatus.MIGRATED,
			},
			undefined,
			{ take: portionSize },
		);

		const newResultsData = trResultsData.map((trResultData) => {
			const trResultStepMigrationData = trResultData.migrationData as PTRunStepsMigrationData;

			const countAttachments = trResultStepMigrationData?.data?.reduce((acc, trResultStep) => {
				acc += trResultStep.trAttachmentIds.length;

				return acc;
			}, 0);

			if (countAttachments > 0) {
				return {
					...trResultData,
					migrationAction: MigrationAction.MIGRATE_ATTACHMENTS,
				};
			}

			return {
				...trResultData,
				migrationStatus: EntityMigrationStatus.MIGRATED_ATTACHMENTS,
			};
		});
		await this.trDataService.update(newResultsData);

		return !!portionSize && trCasesCount > portionSize;
	};

	private readonly fetchTRCaseAttachmentsListPortion = async (portionSize?: number): Promise<boolean> => {
		const trCasesCount = await this.trDataService.countBy(TREntity.CASE, {
			projectId: this.sourceProjectId,
			isAttachmentsFetched: false,
		});
		const trCaseData = await this.trDataService.findOne<TRCaseDto>(TREntity.CASE, {
			projectId: this.sourceProjectId,
			isAttachmentsFetched: false,
		});

		if (!trCaseData) {
			return false;
		}

		const hasMoreItems = await this.fetchTRCaseAttachmentsListByCasePortion(trCaseData.id, portionSize);
		await this.trDataService.update([{ ...trCaseData, isAttachmentsFetched: !hasMoreItems }]);

		return trCasesCount > 1;
	};

	private readonly fetchPTTestsAttachmentsList = async (): Promise<void> => {
		const ptTestsData = await this.ptDataService.find<PTTestDto>(PTEntity.TEST, {
			projectId: this.destinationProjectId,
			isAttachmentsFetched: false,
		});

		const chunkSize = Math.ceil(+this.configService.get('PRACTITEST_API_LIMIT', 100) / 4);

		await executeAllChunkedAsync(ptTestsData, chunkSize, async (ptTestData): Promise<void> => {
			await this.fetchPTAttachmentsListByEntityId(ptTestData);
		});
	};

	private readonly fetchPTAttachmentsListByEntityId = async <TEntity = any>(ptEntityData: PTData<TEntity>): Promise<void> => {
		this.logger.log({
			message: `Fetching attachments for entity ${ptEntityData.type} with id ${ptEntityData.id}`,
			entity: ptEntityData.type,
			entityId: ptEntityData.id,
		});

		const ptGetAttachmentsForEntity = this.ptRateLimitService.throttle(
			this.ptAttachmentsApiService.getAttachmentsForEntity,
		);

		const ptAttachmentsCount = await this.ptDataService.count(
			PTEntity.ATTACHMENT,
			this.destinationProjectId,
			ptEntityData.type,
			ptEntityData.id,
		);

		const pageSize = 250;

		let nextPage: number | null | undefined = Math.ceil(ptAttachmentsCount / pageSize) + 1;
		while (nextPage) {
			const response = await ptGetAttachmentsForEntity(
				this.destinationProjectId,
				ptEntityData.type,
				Number(ptEntityData.id),
				{
					pagination: {
						pageNumber: nextPage,
						pageSize,
					},
				},
			);

			await this.ptDataService.save(
				this.destinationProjectId,
				PTEntity.ATTACHMENT,
				response.data,
				ptEntityData.type,
				ptEntityData.id,
			);

			await this.ptDataService.update([{ ...ptEntityData, isAttachmentsFetched: true }]);

			this.statisticsService.increaseProcessedEntitiesCount(
				this.type,
				MigrationEntityStepStage.PULLING,
				'pt_attachment',
				response.data.length,
			);
			nextPage = response?.meta?.nextPage;
		}

		this.logger.log({
			message: `Successfully fetched attachments for entity ${ptEntityData.type} with id ${ptEntityData.id}`,
			entity: ptEntityData.type,
			entityId: ptEntityData.id,
		});
	};

	private readonly fetchTRCaseAttachmentsListByCasePortion = async (trCaseId: string, portionSize?: number): Promise<boolean> => {
		const trGetAttachmentsForCase = this.trRateLimitService.throttle(this.trAttachmentApiService.getAttachmentsForCase);
		const trCaseAttachmentsCount = await this.trDataService.count(
			TREntity.ATTACHMENT,
			this.sourceProjectId,
			TREntity.CASE,
			trCaseId,
		);

		const pageSize = Math.min(250, portionSize ?? 250);
		let page = Math.ceil(trCaseAttachmentsCount / pageSize);
		let pulledItemsCount = 0;

		let hasMoreItems: boolean;
		let reachedPortionLimit: boolean;
		do {
			const response = await trGetAttachmentsForCase(Number(trCaseId), IS_TESTRAIL_CLOUD_INSTANCE ? {
				pagination: {
					limit: pageSize,
					offset: pageSize * page,
				},
			} : undefined);
			await this.trDataService.save(
				this.sourceProjectId,
				TREntity.ATTACHMENT,
				response.attachments,
				TREntity.CASE,
				trCaseId,
			);

			this.statisticsService.increaseProcessedEntitiesCount(
				this.type,
				MigrationEntityStepStage.PULLING,
				'tr_attachment',
				response?.attachments.length,
			);
			page++;
			hasMoreItems = !!response?._links?.next;
			pulledItemsCount += response?.attachments?.length;
			reachedPortionLimit = !portionSize ? false : pulledItemsCount >= portionSize;
			// eslint-disable-next-line no-unmodified-loop-condition
		} while (IS_TESTRAIL_CLOUD_INSTANCE && hasMoreItems && !reachedPortionLimit);

		return hasMoreItems;
	};

	private readonly fetchEncodedAttachment = async (attachmentId: string): Promise<string> => {
		const trGetAttachmentById = this.trRateLimitService.throttle(this.trAttachmentApiService.getAttachmentById);
		const dataStream = await trGetAttachmentById(attachmentId);

		return Buffer.from(dataStream).toString('base64');
	};

	private readonly fetchEncodedAttachmentWithDetails = async (
		attachmentId: string,
	): Promise<{ filename: string; size: number; contentEncoded: string }> => {
		const trGetAttachmentWithDetailsById = this.trRateLimitService.throttle(
			this.trAttachmentApiService.getAttachmentWithDetailsById,
		);
		const { filename, data, size } = await trGetAttachmentWithDetailsById(attachmentId);

		return { filename, size, contentEncoded: Buffer.from(data).toString('base64') };
	};

	private readonly fetchPTStepRuns = async (): Promise<void> => {
		const ptGetStepRunsByProjectId = this.ptRateLimitService.throttle(this.ptRunsApiService.getStepRunsByProjectId);
		const ptStepRunsCount = await this.ptDataService.count(PTEntity.STEP_RUN, this.destinationProjectId);

		const pageSize = 250;
		let nextPage: number | null | undefined = Math.ceil(ptStepRunsCount / pageSize) + 1;
		while (nextPage) {
			const response = await ptGetStepRunsByProjectId(this.destinationProjectId, {
				pagination: {
					pageNumber: nextPage,
					pageSize,
				},
			});

			const newData = response.data.map((stepRun) => ({
				...stepRun,
				parentId: stepRun.attributes.runId,
				parentType: PTEntity.RUN,
			}));
			await this.ptDataService.saveWithParent(this.destinationProjectId, PTEntity.STEP_RUN, newData);

			// TODO check it
			this.statisticsService.increaseProcessedEntitiesCount(
				this.type,
				MigrationEntityStepStage.PULLING,
				'pt_step_run',
				response.data.length,
			);
			nextPage = response?.meta?.nextPage;
		}
	};
}
