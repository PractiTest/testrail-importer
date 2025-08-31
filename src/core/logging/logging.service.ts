import { Logger, Injectable, Scope } from '@nestjs/common';

import { TDebugLogBody, TErrorLogBody, TInfoLogBody, TVerboseLogBody, TWarningLogBody } from './logging.types';

import { ProgressService } from '../progress/progress.service';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggingService extends Logger {
	public readonly progress: ProgressService;
	public context?: string;

	constructor(context: string) {
		super(context);

		this.progress = new ProgressService();
	}

	public setContext(context: string): void {
		this.context = context;
	}

	/**
	 * @deprecated use typed alternatives instead
	 */
	public logPlain(message: string, context?: string): void {
		super.log(message, context ?? this.context);
	}

	public override log(body: TInfoLogBody, context?: string): void {
		super.log(this.prepareLogBody(body), context ?? this.context, body);
	}

	public override warn(body: TWarningLogBody, context?: string): void {
		super.warn(this.prepareLogBody(body), context ?? this.context);
	}

	public override error(body: TErrorLogBody, context?: string): void {
		const stack = body.stack;
		delete body.stack;

		super.error(this.prepareLogBody(body), stack, context ?? this.context);
	}

	public override debug(body: TDebugLogBody, context?: string): void {
		super.debug(this.prepareLogBody(body), context ?? this.context);
	}

	public override verbose(body: TVerboseLogBody, context?: string): void {
		super.verbose(this.prepareLogBody(body), context ?? this.context);
	}

	private prepareLogBody<T>(body: T): T {
		const untypedBody = body as Record<string, unknown>;
		untypedBody.value = undefined;

		untypedBody.progress = this.progress.getProgress();
		untypedBody.total = this.progress.getTotal();
		untypedBody.step = this.progress.getStep();
		untypedBody.barVisible = this.progress.getBarVisible();
		untypedBody.loaderVisible = this.progress.getLoaderVisible();

		return untypedBody as T;
	}
}
