import { Expose, Type } from 'class-transformer';
import { TRBaseApiPaginationResponse, TTRCustomField } from 'src/test-rail/types/general-types';

export class TRRunDto {
	[key: string]: TTRCustomField | undefined; // custom fields (only custom_status?_count)
	@Expose({ name: 'assignedto_id' })
	public assignedToId: number; // The ID of the user the entire test run is assigned to

	@Expose({ name: 'blocked_count' })
	public blockedCount: number; // The number of tests in the test run marked as blocked

	@Expose({ name: 'completed_on' })
	public completedOn?: number; // The date/time when the test run was closed (as UNIX timestamp)

	@Expose({ name: 'config_ids' })
	public configIds: number[]; // The array of IDs of the configurations of the test run (if part of a test plan)

	@Expose({ name: 'created_by' })
	public createdBy: number; // The ID of the user who created the test run

	@Expose({ name: 'created_on' })
	public createdOn: number; // The date/time when the test run was created (as UNIX timestamp)

	@Expose({ name: 'custom_status1_count' })
	public custom_status1_count: number;

	@Expose({ name: 'custom_status2_count' })
	public custom_status2_count: number;

	@Expose({ name: 'custom_status3_count' })
	public custom_status3_count: number;

	@Expose({ name: 'custom_status4_count' })
	public custom_status4_count: number;

	@Expose({ name: 'custom_status5_count' })
	public custom_status5_count: number;

	@Expose({ name: 'custom_status6_count' })
	public custom_status6_count: number;

	@Expose({ name: 'custom_status7_count' })
	public custom_status7_count: number;

	@Expose({ name: 'failed_count' })
	public failedCount: number; // The number of tests in the test run marked as failed

	@Expose({ name: 'include_all' })
	public includeAll: boolean; // True if the test run includes all test cases and false otherwise

	@Expose({ name: 'is_completed' })
	public isCompleted: boolean; // True if the test run was closed and false otherwise

	@Expose({ name: 'milestone_id' })
	public milestoneId: number; // The ID of the milestone this test run belongs to

	@Expose({ name: 'plan_id' })
	public planId: number; // The ID of the test plan this test run belongs to

	@Expose({ name: 'passed_count' })
	public passedCount: number; // The number of tests in the test run marked as passed

	@Expose({ name: 'project_id' })
	public projectId: number; // The ID of the project this test run belongs to

	@Expose({ name: 'retest_count' })
	public retestCount: number; // The number of tests in the test run marked as retest

	@Expose({ name: 'suite_id' })
	public suiteId: number; // The ID of the test suite this test run is derived from

	@Expose({ name: 'untested_count' })
	public untestedCount: number; // The number of tests in the test run marked as untested

	@Expose({ name: 'updated_on' })
	public updatedOn?: number; // The date/time when the test run was updated — requires TestRail 6.5.2 or later.

	// custom_status?_count: number; The number of tests in the test run with the respective custom status
	public id: number;
	public config?: string; // The configuration of the test run as a string (if part of a test plan)
	public description?: string; // The description of the test run
	public name: string; // The name of the test run
	public url: string; // The address/URL of the test run in the user interface
	public refs?: string; // A comma-separated list of references/requirements
}

export class TRGetRunsApiPaginationResponse extends TRBaseApiPaginationResponse {
	@Type(() => TRRunDto)
	public runs: TRRunDto[];
}
