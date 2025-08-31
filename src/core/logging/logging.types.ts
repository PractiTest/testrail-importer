export type TBaseLogBody = {
	message: string;
} & Record<string, any>;

export type TInfoLogBody = TBaseLogBody;
export type TDebugLogBody = TBaseLogBody;
export type TVerboseLogBody = TBaseLogBody;
export type TWarningLogBody = TBaseLogBody;

export type TErrorLogBody = {
	error?: Error;
	stack?: string;
} & TBaseLogBody;
