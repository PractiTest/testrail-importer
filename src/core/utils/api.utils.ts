import { chunk } from 'lodash';
import { Readable } from 'stream';

export const executeAllChunkedAsync = async <T, R>(
	values: T[],
	chunkSize: number,
	asyncFunction: (element: T, index: number, array: T[], chunkNumber: number) => Promise<R>,
): Promise<R[]> => {
	const chunks = chunk(values, chunkSize);
	const res: R[] = [];

	for (let chunkNumber = 0; chunkNumber < chunks.length; chunkNumber++) {
		const chunk = chunks[chunkNumber];
		const chunkResults = await Promise.all(
			chunk.map(async (val, index, array) => asyncFunction(val, index, array, chunkNumber)),
		);
		res.push(...chunkResults);
	}

	return res;
};

export const streamToPromise = async (stream: Readable): Promise<string> => {
	const chunks: Buffer[] = [];

	return new Promise((resolve, reject) => {
		stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
		stream.on('error', (err: Error) => {
			reject(err);
		});
		stream.on('end', () => {
			resolve(Buffer.concat(chunks).toString('utf8'));
		});
	});
};
