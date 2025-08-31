export interface IAppConfig {
	LOGGING_PREFER_JSON: string;
	LOGGING_WRITE_TO_FILE: string;
	LOGGING_FILES_DIR: string;
	LOGGING_LEVEL: string;

	TEST_ENV: string;

	PRACTITEST_BASE_URL: string;
	PRACTITEST_USERNAME: string;
	PRACTITEST_API_KEY: string;
	PRACTITEST_API_LIMIT: string;

	TESTRAIL_BASE_URL: string;
	TESTRAIL_USERNAME: string;
	TESTRAIL_API_KEY: string;
	TESTRAIL_API_LIMIT: string;

	DATABASE_DIR: string;

	ENABLE_CHUNKED_PUSH: string;
	ENABLE_BULK_CHUNKED_PUSH: string;

	FALLBACK_USER_EMAIL: string;

	MIGRATE_USERS: string;

	MIGRATE_CASES: string;

	MIGRATE_TESTS: string;

	MIGRATE_RUNS: string;

	MIGRATE_RESULTS: string;

	MIGRATE_ATTACHMENTS: string;

	BATCH_SIZE: string;
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace NodeJS {
		interface ProcessEnv extends IAppConfig {}
	}
}
