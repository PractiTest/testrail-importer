import { LoggingService } from '../logging/logging.service';
import readline from 'readline';
import { StatisticsService } from 'src/core/statistics/statistics.service';

export const registerUnhandledRejectionHandler = (logger: LoggingService): void => {
	process.on('unhandledRejection', (reason) => {
		logger.error({
			message: 'Unhandled Rejection at Promise',
			error: reason as Error,
		});

		process.exit(1);
	});
};

export const registerUncaughtExceptionHandler = (logger: LoggingService): void => {
	process.on('uncaughtException', (reason) => {
		logger.error({ message: 'Uncaught Exception thrown', error: reason });

		process.exit(1);
	});
};

/**
 * Graceful stop doesn't work with interactive docker shell on windows environments.
 * This workaround is needed to make dockerized app multiplatform
 */
export const registerCtrlCListener = (logger: LoggingService): void => {
	if (process.platform === 'win32') {
		const readInterface = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		readInterface.on('SIGINT', () => {
			process.emit('SIGINT');
		});
	}

	process.on('SIGINT', () => {
		logger.progress.setBarVisible(false);
		logger.progress.setLoaderVisible(false);
		logger.warn({ message: 'Application has been stopped manually!' });
		process.exit();
	});
};

export const registerExitListener = (logger: LoggingService, statisticsService: StatisticsService): void => {
	process.on('exit', () => {
		if (statisticsService.migrationStart) {
			statisticsService.captureEnd();
			logger.log({ message: statisticsService.getDetailedStats() });
		}
	});
};
