import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MigrationData } from './entities/migration-data.entity';
import { TRData } from './entities/test-rail.entity';
import { PTData } from './entities/practi-test.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IAppConfig } from 'src/core/types/app.config';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService<IAppConfig>) => ({
				type: 'sqlite',
				database: process.env.NODE_ENV === 'development' ? ':memory:' : configService.get('DATABASE_DIR', ''),
				entities: [MigrationData, TRData, PTData],
				synchronize: true,
				logging: false,
			}),
		}),
	],
})
export class DatabaseModule {}
