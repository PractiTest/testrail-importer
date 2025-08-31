import { Injectable } from '@nestjs/common';
import { confirm } from '@inquirer/prompts';

import { UserMigrationService } from './services/user-migration.service';
import { CaseMigrationService } from './services/case-migration.service';
import { RunMigrationService } from './services/run-migration.service';
import { TestMigrationService } from './services/test-migration.service';
import { ResultMigrationService } from './services/result-migration.service';
import { AttachmentMigrationService } from './services/attachment-migration.service';

import { MigrationDataService } from 'src/migration-data/services/migration-data.service';
import { PTDataService } from 'src/migration-data/services/practi-test-data.service';
import { TRDataService } from 'src/migration-data/services/test-rail-data.service';

import {
	MigrationDataStatus,
	MigrationEntityStep,
} from 'src/core/types/migration';
import { LoggingService } from 'src/core/logging/logging.service';

import { StatisticsService } from 'src/core/statistics/statistics.service';
import { ConfigService } from '@nestjs/config';
import { IMigrationProcessInfo } from 'src/migration/types/migration-process-info.interface';
import { registerCtrlCListener, registerExitListener } from 'src/core/utils/process.utils';
import { MigrationInitializationService } from 'src/migration/services/migration-initialization.service';
import { IAppConfig } from 'src/core/types/app.config';

@Injectable()
export class MigrationService {
	private currentMigrationProcess: IMigrationProcessInfo;

	// eslint-disable-next-line max-params
	constructor(
		private readonly logger: LoggingService,
		private readonly migrationInitializationService: MigrationInitializationService,
		private readonly migrationDataService: MigrationDataService,
		private readonly trDataService: TRDataService,
		private readonly ptDataService: PTDataService,
		private readonly userMigrationService: UserMigrationService,
		private readonly caseMigrationService: CaseMigrationService,
		private readonly runMigrationService: RunMigrationService,
		private readonly testMigrationService: TestMigrationService,
		private readonly resultMigrationService: ResultMigrationService,
		private readonly attachmentMigrationService: AttachmentMigrationService,
		private readonly statisticsService: StatisticsService,
		private readonly configService: ConfigService<IAppConfig>,
	) {
		registerCtrlCListener(this.logger);
		registerExitListener(this.logger, this.statisticsService);
	}

	public async start(): Promise<void> {
		try {
			let shouldInitializeNewMigration = true;
			const latestMigration = await this.migrationDataService.getLast();
			const isLatestMigrationIncomplete =
				latestMigration &&
				![MigrationDataStatus.SUCCESSFUL, MigrationDataStatus.FAILED].includes(latestMigration.status);

			if (isLatestMigrationIncomplete) {
				const userWantsToFinishIncomplete = await confirm({
					message: 'The last migration is incomplete. Do you want to finish it?',
				});

				if (userWantsToFinishIncomplete) {
					// initialize process from the latest available state, and skip prompts
					this.currentMigrationProcess = await this.migrationInitializationService.initializeIncompleteMigration();
					shouldInitializeNewMigration = false;
				} else {
					// Remove incomplete migration and continue usual process
					await this.migrationDataService.deleteById(latestMigration.id);
					shouldInitializeNewMigration = true;
				}
			}

			const allMigrationSteps = Object.values(MigrationEntityStep);
			const notMigratedSteps: MigrationEntityStep[] = [];

			for (const step of allMigrationSteps) {
				if (!latestMigration?.migratedEntitySteps.includes(step)) {
					notMigratedSteps.push(step);
				}
			}

			const canLatestMigrationBeContinued =
				latestMigration &&
				latestMigration.status === MigrationDataStatus.SUCCESSFUL &&
				notMigratedSteps.length > 0;

			if (!isLatestMigrationIncomplete && canLatestMigrationBeContinued) {
				const userWantsToContinuePrevious = await confirm({
					message: `The last migration has steps that were not migrated (${notMigratedSteps.join(', ')}). Do you want to continue migration?`,
				});

				if (userWantsToContinuePrevious) {
					// initialize process from the latest available state, and skip prompts
					this.currentMigrationProcess = await this.migrationInitializationService.initializeIncompleteMigration(notMigratedSteps[0]);
					shouldInitializeNewMigration = false;
				} else {
					// Remove incomplete migration and continue usual process
					await this.migrationDataService.deleteById(latestMigration.id);
					shouldInitializeNewMigration = true;
				}
			}

			if (shouldInitializeNewMigration) {
				this.currentMigrationProcess =
					await this.migrationInitializationService.initializeNewMigrationWithInteractivePrompt();
			}

			await this.executeCurrentMigration();
		} catch (error) {
			this.logger.error({
				message: `Error during migration starting: ${error.message}`,
				error,
			});
		}
	}

	private async addMigratedEntityStep(migratedStep: MigrationEntityStep): Promise<void> {
		this.currentMigrationProcess.migratedEntitySteps.push(migratedStep);
		await this.migrationDataService.updateById(this.currentMigrationProcess.id, {
			migratedEntitySteps: this.currentMigrationProcess.migratedEntitySteps,
		});
	}

	private readonly getEntitySkippingMessage = (entityStep: MigrationEntityStep): string => `Skipping ${entityStep}s migration...`;

	private async executeCurrentMigration(): Promise<void> {
		try {
			this.statisticsService.captureStart();
			this.logger.progress.setLoaderVisible(true);

			const batchSize = Number(this.configService.get('BATCH_SIZE')) ?? 500;

			// ToDo: use currentMigrationProcess instead of long list of properties
			if (await this.userMigrationService.getShouldExecuteEntityMigration(this.currentMigrationProcess)) {
				this.userMigrationService.initialize(this.currentMigrationProcess);
				await this.userMigrationService.migrateAllItemsBatched(batchSize);
				await this.addMigratedEntityStep(MigrationEntityStep.USER);
			} else {
				this.logger.log({ message: this.getEntitySkippingMessage(MigrationEntityStep.USER) });
			}

			if (await this.caseMigrationService.getShouldExecuteEntityMigration(this.currentMigrationProcess)) {
				this.caseMigrationService.initialize(this.currentMigrationProcess);
				await this.caseMigrationService.migrateAllItemsBatched(batchSize);
				await this.addMigratedEntityStep(MigrationEntityStep.CASE);
			} else {
				this.logger.log({ message: this.getEntitySkippingMessage(MigrationEntityStep.CASE) });
			}

			if (await this.runMigrationService.getShouldExecuteEntityMigration(this.currentMigrationProcess)) {
				this.runMigrationService.initialize(this.currentMigrationProcess);
				await this.runMigrationService.migrateAllItemsBatched(batchSize);
				await this.addMigratedEntityStep(MigrationEntityStep.RUN);
			} else {
				this.logger.log({ message: this.getEntitySkippingMessage(MigrationEntityStep.RUN) });
			}

			if (await this.testMigrationService.getShouldExecuteEntityMigration(this.currentMigrationProcess)) {
				this.testMigrationService.initialize(this.currentMigrationProcess);
				await this.testMigrationService.migrateAllItemsBatched(batchSize);
				await this.addMigratedEntityStep(MigrationEntityStep.TEST);
			} else {
				this.logger.log({ message: this.getEntitySkippingMessage(MigrationEntityStep.TEST) });
			}

			if (await this.resultMigrationService.getShouldExecuteEntityMigration(this.currentMigrationProcess)) {
				this.resultMigrationService.initialize(this.currentMigrationProcess);
				await this.resultMigrationService.migrateAllItemsBatched(batchSize);
				await this.addMigratedEntityStep(MigrationEntityStep.RESULT);
			} else {
				this.logger.log({ message: this.getEntitySkippingMessage(MigrationEntityStep.RESULT) });
			}

			if (await this.attachmentMigrationService.getShouldExecuteEntityMigration(this.currentMigrationProcess)) {
				this.attachmentMigrationService.initialize(this.currentMigrationProcess);
				await this.attachmentMigrationService.migrateAllItemsBatched(batchSize);
				await this.addMigratedEntityStep(MigrationEntityStep.ATTACHMENT);
			} else {
				this.logger.log({ message: this.getEntitySkippingMessage(MigrationEntityStep.ATTACHMENT) });
			}

			await this.handleSuccess();
		} catch (error) {
			await this.handleFail(error);
		} finally {
			this.statisticsService.captureEnd();
			this.logger.log({ message: this.statisticsService.getDetailedStats() });
			await this.finish(true);
		}
	}

	private async handleSuccess(): Promise<void> {
		const migration = await this.migrationDataService.getById(this.currentMigrationProcess.id!);

		if (migration?.status !== MigrationDataStatus.FAILED) {
			await this.updateMigrationStatus(MigrationDataStatus.SUCCESSFUL);
		}
	}

	private async handleFail(error: any): Promise<void> {
		this.logger.error({ message: error.message, error });

		await this.migrationDataService.updateById(this.currentMigrationProcess.id!, {
			status: MigrationDataStatus.FAILED,
			error: String(error),
		});
	}

	private async finish(exitOnComplete: boolean = true): Promise<void> {
		try {
			await this.migrationDataService.updateById(this.currentMigrationProcess.id!, { finishedAt: new Date() });

			this.logger.log({ message: 'Migration completed' });

			if (exitOnComplete) {
				process.exit();
			}
		} catch (error) {
			this.logger.error({ message: 'Error during migration finishing:', error });
		}
	}

	private async clearAllCachedEntities(): Promise<void> {
		await this.trDataService.clear();
		await this.ptDataService.clear();
	}

	private async updateMigrationStatus(status: MigrationDataStatus): Promise<void> {
		await this.migrationDataService.updateById(this.currentMigrationProcess.id!, { status });
	}
}
