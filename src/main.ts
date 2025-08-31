import { NestFactory } from '@nestjs/core';
import 'dotenv/config';

import { AppModule } from './app.module';

import {
	registerUncaughtExceptionHandler,
	registerUnhandledRejectionHandler,
} from './core/utils/process.utils';
import { createRootLoggingTransport } from './core/logging/logging.utils';
import { LoggingService } from './core/logging/logging.service';

import { MigrationService } from './migration/migration.service';

const rootLogger = new LoggingService('ApplicationRoot');

async function bootstrap(): Promise<void> {
	const app = await NestFactory.createApplicationContext(AppModule, {
		logger: createRootLoggingTransport(),
	});

	const migration = app.get(MigrationService);
	await migration.start();

	await app.close();
}
bootstrap();

registerUnhandledRejectionHandler(rootLogger);
registerUncaughtExceptionHandler(rootLogger);
