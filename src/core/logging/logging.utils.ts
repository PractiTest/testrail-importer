import * as Transport from 'winston-transport';
import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';
import { format } from 'date-fns';
import { LoggerService } from '@nestjs/common';

import ProgressBarManager from './progress-bar-manager';
import { coloredStringFormatWithLoader } from 'src/core/logging/colored-string-format-with.loader';

export const createRootLoggingTransport = (): LoggerService => {
	let transports: Transport[] = [];

	const jsonFormat = winston.format.combine(winston.format.timestamp(), winston.format.ms(), winston.format.json());

	const progressBarManager = new ProgressBarManager();

	if (process.env.LOGGING_PREFER_JSON === 'true') {
		transports.push(
			new winston.transports.Console({
				format: jsonFormat,
				level: process.env.LOGGING_LEVEL,
			}),
		);
	} else {
		transports.push(
			new winston.transports.Console({
				format: winston.format.combine(
					winston.format.timestamp(),
					winston.format.ms(),
					coloredStringFormatWithLoader(progressBarManager),
				),
				level: process.env.LOGGING_LEVEL,
			}),
		);
	}

	if (process.env.LOGGING_WRITE_TO_FILE === 'true') {
		const timestampString = format(new Date(), 'yyyy-MM-dd-hh-mm-ss');

		transports = [
			...transports,
			new winston.transports.File({
				format: jsonFormat,
				level: 'info',
				lazy: true,
				filename: `${process.env.LOGGING_FILES_DIR}/${timestampString}/full.log`,
				maxsize: 50 * 1024 * 1024,
				zippedArchive: true,
			}),
			new winston.transports.File({
				format: jsonFormat,
				level: 'error',
				lazy: true,
				filename: `${process.env.LOGGING_FILES_DIR}/${timestampString}/errors.log`,
				maxsize: 50 * 1024 * 1024,
				zippedArchive: false,
			}),
		];
	}

	return WinstonModule.createLogger({ transports });
};
