import pThrottle from 'p-throttle';

export type TFuncWrapper = <T extends Array<any>, U>(fn: (...args: T) => U) => (...args: T) => U;

export class RateLimitService {
	constructor(
		protected readonly apiLimit: number,
		public readonly throttle: TFuncWrapper = pThrottle({ limit: apiLimit, interval: 60000 }) as TFuncWrapper,
	) {}
}
