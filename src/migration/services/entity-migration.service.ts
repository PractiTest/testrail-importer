import { Inject } from '@nestjs/common';
import { capitalize } from 'lodash';

import { LoggingService } from 'src/core/logging/logging.service';

import { MigrationDataService } from 'src/migration-data/services/migration-data.service';
import { TRDataService } from 'src/migration-data/services/test-rail-data.service';
import { PTDataService } from 'src/migration-data/services/practi-test-data.service';

import {
	MigrationCurrentEntity,
	MigrationDataStatus,
	MigrationEntityStep,
	MigrationEntityStepStage,
} from 'src/core/types/migration';
import { StatisticsService } from 'src/core/statistics/statistics.service';
import { IMigrationProcessInfo } from 'src/migration/types/migration-process-info.interface';
import { TRSuiteDto } from 'src/test-rail/types/suites.dto';
import { ProjectSuiteMode } from 'src/test-rail/types/project.dto';

export abstract class EntityMigrationService {
	@Inject(LoggingService)
	protected readonly logger: LoggingService;

	@Inject(MigrationDataService)
	protected readonly migrationDataService: MigrationDataService;

	@Inject(TRDataService)
	protected readonly trDataService: TRDataService;

	@Inject(PTDataService)
	protected readonly ptDataService: PTDataService;

	@Inject(StatisticsService)
	protected readonly statisticsService: StatisticsService;

	protected migrationId: number;
	protected sourceProjectId: number;
	protected destinationProjectId: number;
	protected fallbackUserEmail: string;
	protected currentEntity: MigrationCurrentEntity;
	protected suiteMode: ProjectSuiteMode;
	protected sourceProjectSuites: TRSuiteDto[];

	protected abstract type: MigrationEntityStep;

	public initialize = (migrationProcess: IMigrationProcessInfo): void => {
		this.migrationId = migrationProcess.id;
		this.sourceProjectId = migrationProcess.sourceProjectId;
		this.destinationProjectId = migrationProcess.destinationProjectId;
		this.suiteMode = migrationProcess.suiteMode;
		this.sourceProjectSuites = migrationProcess.sourceProjectSuites;
		this.fallbackUserEmail = migrationProcess.fallbackUserEmail;

		if (migrationProcess.lastProcessedEntity) {
			this.currentEntity = migrationProcess.lastProcessedEntity;
		}
	};

	public migrateAllItemsBatched = async (batchSize?: number): Promise<void> => {
		try {
			await this.updateCurrentMigrationEntity(this.type);

			this.statisticsService.captureMigrationStageStarted(this.type, MigrationEntityStepStage.PULLING);
			await this.updateCurrentMigrationEntityStage(this.type, MigrationEntityStepStage.PULLING);
			await this.pullAllRequiredData();
			this.statisticsService.captureMigrationStageFinished(this.type, MigrationEntityStepStage.PULLING);

			let hasMoreItemsToProcess = true;

			while (hasMoreItemsToProcess) {
				this.statisticsService.captureMigrationStageStarted(this.type, MigrationEntityStepStage.PULLING);
				await this.updateCurrentMigrationEntityStage(this.type, MigrationEntityStepStage.PULLING);
				hasMoreItemsToProcess = await this.pullNextTrDataPortion(batchSize);
				this.statisticsService.captureMigrationStageFinished(this.type, MigrationEntityStepStage.PULLING);

				this.statisticsService.captureMigrationStageStarted(this.type, MigrationEntityStepStage.COMPARING);
				await this.updateCurrentMigrationEntityStage(this.type, MigrationEntityStepStage.COMPARING);
				await this.compareAwaitingData();
				this.statisticsService.captureMigrationStageFinished(this.type, MigrationEntityStepStage.COMPARING);

				this.statisticsService.captureMigrationStageStarted(this.type, MigrationEntityStepStage.PUSHING);
				await this.updateCurrentMigrationEntityStage(this.type, MigrationEntityStepStage.PUSHING);
				await this.verifyPreviouslyUnfinishedData();
				await this.pushData();
				this.statisticsService.captureMigrationStageFinished(this.type, MigrationEntityStepStage.PUSHING);
			}
			this.handleSuccess();
		} catch (e) {
			await this.handleError(e);
		}
	};

	/**
	 * Writes to persistent storage, that process reached the specific entity type processing
	 */
	private readonly updateCurrentMigrationEntity = async (entityStep: MigrationEntityStep): Promise<void> => {
		await this.migrationDataService.updateById(this.migrationId, { entityStep });

		this.logStepMessage(`Processing ${capitalize(this.type)}...`);
	};

	/**
	 * Writes to persistent storage, that process reached the specific entity type and stage processing
	 */
	private readonly updateCurrentMigrationEntityStage = async (
		entityStep: MigrationEntityStep,
		entityStepStage: MigrationEntityStepStage,
	): Promise<void> => {
		await this.migrationDataService.updateById(this.migrationId, { entityStep, entityStepStage });

		this.logStepMessage(`Processing ${capitalize(this.type)}...`);
	};

	private readonly handleSuccess = (): void => {
		// this.logger.progress.addProgress(20);
		this.logStepMessage(`${capitalize(this.type)} completed`);
	};

	private readonly logStepMessage = (message: string): void => {
		this.logger.progress.setStep(message);
		this.logger.log({ message });
	};

	private readonly handleError = async (e: any): Promise<void> => {
		this.logger.error({ message: e.message, error: e });

		const error = `Error while processing ${this.type}: ${e.message}`;

		await this.migrationDataService.updateById(this.migrationId, { error, status: MigrationDataStatus.FAILED });
	};

	/**
	 * Takes any data needed from the higher level (e.g. migration process object, env variables) to identify,
	 * if this step has to be executed.
	 */
	public abstract getShouldExecuteEntityMigration(migrationProcess: IMigrationProcessInfo): Promise<boolean>;

	/**
	 * Pulls all the data required for proper comparison.
	 * Includes PractiTest data, shared data, templates, etc.
	 */
	protected abstract pullAllRequiredData(): Promise<void>;

	/**
	 * Takes the start index based on how many entities are stored in the DB
	 * @returns if TestRail has more entities to process
	 */
	protected abstract pullNextTrDataPortion(batchSize?: number): Promise<boolean>;

	/**
	 * Compare entries with `Not Migrated` status to detect what to do with them
	 */
	protected abstract compareAwaitingData(): Promise<void>;

	protected abstract verifyPreviouslyUnfinishedData(): Promise<void>;

	protected abstract pushData(): Promise<void>;
}
