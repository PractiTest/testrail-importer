import { MigrationEntityStep } from 'src/core/types/migration';
import * as process from 'process';

export const MIGRATION_CHUNK_SIZE_MULTIPLIERS = {
	ATTACHMENTS: 0.02,
	CASES: 0.2,
	RESULTS: 0.02, // bulk
	RUNS: 0.25,
	TESTS: 0.02, // bulk
	USERS: 0.25,
};

export const MIGRATION_ENTITY_STEPS_SEQUENCE = [
	MigrationEntityStep.USER,
	MigrationEntityStep.CASE,
	MigrationEntityStep.RUN,
	MigrationEntityStep.TEST,
	MigrationEntityStep.RESULT,
	MigrationEntityStep.ATTACHMENT
];

export const MIGRATION_ENTITY_STEPS_ENV_MAP = new Map<MigrationEntityStep, boolean>([
	[MigrationEntityStep.USER, process.env.MIGRATE_USERS !== 'false'],
	[MigrationEntityStep.CASE, process.env.MIGRATE_CASES !== 'false'],
	[MigrationEntityStep.RUN, process.env.MIGRATE_RUNS !== 'false'],
	[MigrationEntityStep.TEST, process.env.MIGRATE_TESTS !== 'false'],
	[MigrationEntityStep.RESULT, process.env.MIGRATE_RESULTS !== 'false'],
	[MigrationEntityStep.ATTACHMENT, process.env.MIGRATE_ATTACHMENTS !== 'false']
]);

export const IS_TESTRAIL_CLOUD_INSTANCE = !!process.env.TESTRAIL_BASE_URL?.toLowerCase().includes('.testrail.io');
