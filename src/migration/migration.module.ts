import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MigrationService } from './migration.service';

import { UserMigrationService } from './services/user-migration.service';
import { CaseMigrationService } from './services/case-migration.service';
import { RunMigrationService } from './services/run-migration.service';
import { TestMigrationService } from './services/test-migration.service';
import { ResultMigrationService } from './services/result-migration.service';
import { AttachmentMigrationService } from './services/attachment-migration.service';

import { LoggingModule } from 'src/core/logging/logging.module';
import { MigrationDataModule } from 'src/migration-data/migration-data.module';

import { TestRailModule } from 'src/test-rail/test-rail.module';
import { PractiTestModule } from 'src/practi-test/practi-test.module';
import { StatisticsService } from 'src/core/statistics/statistics.service';
import { MigrationInitializationService } from 'src/migration/services/migration-initialization.service';

@Module({
	imports: [LoggingModule, MigrationDataModule, TestRailModule, PractiTestModule, ConfigModule],
	providers: [
		MigrationInitializationService,
		MigrationService,
		UserMigrationService,
		CaseMigrationService,
		RunMigrationService,
		TestMigrationService,
		ResultMigrationService,
		AttachmentMigrationService,
		StatisticsService,
	],
	exports: [MigrationService],
})
export class MigrationModule {}
