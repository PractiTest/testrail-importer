import * as winston from 'winston';
import safeStringify from 'fast-safe-stringify';
import ProgressBarManager from './progress-bar-manager';

let prevLineTakenByUtil: boolean = false;

const clc = {
	bold: (text: string) => `\x1B[1m${text}\x1B[0m`,
	green: (text: string) => `\x1B[32m${text}\x1B[39m`,
	yellow: (text: string) => `\x1B[33m${text}\x1B[39m`,
	red: (text: string) => `\x1B[31m${text}\x1B[39m`,
	magentaBright: (text: string) => `\x1B[95m${text}\x1B[39m`,
	cyanBright: (text: string) => `\x1B[96m${text}\x1B[39m`,
};

const nestLikeColorScheme: Record<string, (text: string) => string> = {
	log: clc.green,
	info: clc.green,
	error: clc.red,
	warn: clc.yellow,
	debug: clc.magentaBright,
	verbose: clc.cyanBright,
};

/**
 * High-order functions, which returns the winston formatter capable of logging data combined with displaying loader
 * or progress data based on the log entry metadata
 * @param progressBarManager
 */
export const coloredStringFormatWithLoader = (progressBarManager: ProgressBarManager) =>
	winston.format.printf((data) => {
		const { level, timestamp, context, message, ms, progress, total, step, barVisible, loaderVisible, ...meta } = data;

		let transformedTimestamp: string | null = null;

		if (typeof timestamp !== 'undefined') {
			// Only format the timestamp to a locale representation if it's ISO 8601 format. Any format
			// that is not a valid date string will throw, just ignore it (it will be printed as-is).
			try {
				if (timestamp === new Date(timestamp).toISOString()) {
					transformedTimestamp = new Date(timestamp).toLocaleString();
				}
			} catch (error) {
				// eslint-disable-next-line no-empty
			}
		}

		const color = nestLikeColorScheme[level] || ((text: string): string => text);
		const yellow = clc.yellow;

		const stringifiedMeta = safeStringify(meta);

		if (prevLineTakenByUtil) {
			process.stdout.moveCursor(0, -1);
			process.stdout.clearLine(1);
		}

		process.stdout.write(
			(transformedTimestamp ? `${transformedTimestamp} ` : '').padEnd(4) +
				`[${color(level.toUpperCase())}] ` +
				(typeof context !== 'undefined' ? `${yellow('[' + context + ']')} ` : '') +
				`${color(message)}` +
				(stringifiedMeta && stringifiedMeta !== '{}' ? ` - ${stringifiedMeta}` : ''),
		);

		if (barVisible && progress && total) {
			progressBarManager.render(progress, total, step);
		} else if (loaderVisible) {
			process.stdout.write(`\n⌛ ${step}`);
		}

		prevLineTakenByUtil = barVisible || loaderVisible;

		return '';
	});
