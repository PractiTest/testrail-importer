import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './core/db/db.module';
import { LoggingModule } from './core/logging/logging.module';

import { MigrationModule } from './migration/migration.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		DatabaseModule,
		LoggingModule,
		MigrationModule,
	],
	providers: [],
})
export class AppModule {}
