import { TRRunDto } from 'src/test-rail/types/run.dto';
import { Expose, Transform, Type } from 'class-transformer';
import { TRApiOptions, TRBaseApiPaginationResponse, TTRCustomField } from 'src/test-rail/types/general-types';

// WON'T BE MIGRATED
export class TRPlanEntry {
	@Expose({ name: 'suite_id' })
	public suiteId: number;

	@Expose({ name: 'include_all' })
	public includeAll: boolean;

	public id: string;
	public refs?: string;
	public description?: string;
	public runs: TRRunDto[];
}

export class TRPlanDto {
	[key: string]: TTRCustomField | undefined; // custom fields (only custom_status?_count)
	@Expose({ name: 'assignedto_id' })
	public assignedToId: number; // The ID of the user the entire test plan is assigned to

	@Expose({ name: 'blocked_count' })
	public blockedCount: number; // The number of tests in the test plan marked as blocked

	@Expose({ name: 'completed_on' })
	public completedOn: number; // The date/time when the test plan was closed (as UNIX timestamp)

	@Expose({ name: 'created_by' })
	public createdBy: number; // The ID of the user who created the test plan

	@Expose({ name: 'created_on' })
	public createdOn: number; // The date/time when the test plan was created (as UNIX timestamp)

	@Type(() => TRPlanEntry)
	public entries: TRPlanEntry[]; // An array of 'entries', i.e. group of test runs

	@Expose({ name: 'failed_count' })
	public failedCount: number; // The number of tests in the test plan marked as failed

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

	@Expose({ name: 'is_completed' })
	public isCompleted: boolean; // True if the test plan was closed and false otherwise

	@Expose({ name: 'milestone_id' })
	public milestoneId: number; // The ID of the milestone this test plan belongs to

	@Expose({ name: 'passed_count' })
	public passedCount: number; // The number of tests in the test plan marked as passed

	@Expose({ name: 'project_id' })
	public projectId: number; // The ID of the project this test plan belongs to

	@Expose({ name: 'retest_count' })
	public retestCount: number; // The number of tests in the test plan marked as a retest

	@Expose({ name: 'untested_count' })
	public untestedCount: number; // The number of tests in the test plan marked as untested

	// custom_status?_count: number; // The number of tests in the test plan with the respective custom status
	public id: number; // 	The unique ID of the test plan
	public description?: string; // The description of the test plan
	public name: string; // The name of the test plan
	public refs?: string; // A string of external requirement IDs, separated by commas - requires TestRail 6.3 or later
	public url: string; // The address/URL of the test plan in the user interface
}

export class TRPlansArrayEntry extends TRPlanDto {
	public entries: never;
}

export class TRGetPlansApiPaginationResponse extends TRBaseApiPaginationResponse {
	@Type(() => TRPlansArrayEntry)
	public plans: TRPlansArrayEntry[];
}

export class TRPlansFilters {
	@Expose({ name: 'created_after', toPlainOnly: true })
	public createdAfter?: number; // timestamp

	@Expose({ name: 'created_before', toPlainOnly: true })
	public createdBefore?: number;

	@Expose({ name: 'created_by', toPlainOnly: true })
	@Transform(({ value }: { value?: number[] }) => value?.join(','), { toPlainOnly: true })
	public createdBy?: number[]; // A comma-separated list of creators (user IDs) to filter by

	@Expose({ name: 'is_completed', toPlainOnly: true })
	public isCompleted?: boolean;

	@Expose({ name: 'milestone_id', toPlainOnly: true })
	@Transform(({ value }: { value?: number[] }) => value?.join(','), { toPlainOnly: true })
	public milestoneId?: number[];
}
export class TRGetPlansOptions extends TRApiOptions {
	@Type(() => TRPlansFilters)
	public filters?: TRPlansFilters;
}
