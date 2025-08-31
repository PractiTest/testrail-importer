import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MigrationDataService } from './services/migration-data.service';
import { TRDataService } from './services/test-rail-data.service';
import { PTDataService } from './services/practi-test-data.service';

import { MigrationData } from '../core/db/entities/migration-data.entity';
import { TRData } from '../core/db/entities/test-rail.entity';
import { PTData } from '../core/db/entities/practi-test.entity';

import { LoggingModule } from '../core/logging/logging.module';
import { LoggingService } from '../core/logging/logging.service';

@Module({
	imports: [TypeOrmModule.forFeature([MigrationData, TRData, PTData]), LoggingModule],
	providers: [LoggingService, MigrationDataService, TRDataService, PTDataService],
	exports: [MigrationDataService, TRDataService, PTDataService],
})
export class MigrationDataModule {}
