export enum MigrationDataStatus {
	NEW = 'NEW',
	SUCCESSFUL = 'SUCCESSFUL',
	FAILED = 'FAILED',
}

export enum MigrationEntityStepStage {
	PULLING = 'PULLING',
	COMPARING = 'COMPARING',
	PUSHING = 'PUSHING',
}

export enum MigrationAction {
	INSERT = 'insert',
	UPDATE = 'update',
	IGNORE = 'ignore',
	CLARIFY = 'clarify',
	COMPARE = 'compare',
	MIGRATE_ATTACHMENTS = 'migrate_attachments',
}

export enum EntityMigrationStatus {
	NOT_MIGRATED = 'not_migrated',
	PENDING = 'pending',
	MIGRATED = 'migrated',
	MIGRATED_ATTACHMENTS = 'migrated_attachments',
	FAILED = 'failed',
}

export enum TREntity {
	PROJECT = 'project',
	USER = 'user',
	CASE = 'case',
	CASE_CUSTOM_FIELD = 'case_custom_field',
	RESULT_CUSTOM_FIELD = 'result_custom_field',
	TEMPLATE = 'template',
	SECTION = 'section',
	RUN = 'run',
	PLAN = 'plan',
	TEST = 'test',
	RESULT = 'result',
	ATTACHMENT = 'attachment',
	SHARED_STEP = 'shared_step',
}

export enum PTEntity {
	PROJECT = 'project',
	USER = 'user',
	GROUP = 'group',
	TEST = 'test',
	TEST_SET = 'testset',
	INSTANCE = 'instance',
	RUN = 'run',
	ATTACHMENT = 'attachment',
	CUSTOM_FIELD = 'custom_field',
	STEP_RUN = 'step_run',
}

export const trPtEntitiesMap = new Map<TREntity, PTEntity>([
	[TREntity.PROJECT, PTEntity.PROJECT],
	[TREntity.USER, PTEntity.USER],
	[TREntity.CASE, PTEntity.TEST],
	[TREntity.RUN, PTEntity.TEST_SET],
	[TREntity.TEST, PTEntity.INSTANCE],
	[TREntity.RESULT, PTEntity.RUN],
]);

export enum MigrationEntityStep {
	USER = 'user',
	CASE = 'case',
	RUN = 'run',
	TEST = 'test',
	RESULT = 'result',
	ATTACHMENT = 'attachment',
}

export const MigrationCurrentEntity = {
	...Object.values(TREntity).map((e) => `tr_${e}`),
	...Object.values(PTEntity).map((e) => `pt_${e}`),
};
export type MigrationCurrentEntity = typeof MigrationCurrentEntity;

export interface Dictionary<T = any> {
	[key: string]: T;
}
