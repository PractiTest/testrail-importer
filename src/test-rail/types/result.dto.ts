import { Expose, Type } from 'class-transformer';
import { TRBaseApiPaginationResponse, TTRCustomField } from 'src/test-rail/types/general-types';

export class TRResultStep {
	@Expose({ name: 'status_id' })
	public statusId: string;

	public content: string;
	public expected: string;
	public actual: string;
}

export class TRResultDto {
	[key: string]: TTRCustomField | undefined; // custom fields

	@Expose({ name: 'assignedto_id' })
	public assignedToId: number; // The ID of the assignee (user) of the test result

	@Expose({ name: 'created_by' })
	public createdBy: number; // The ID of the user who created the test result

	@Expose({ name: 'created_on' })
	public createdOn: number; // The date/time when the test result was created (as UNIX timestamp)

	@Expose({ name: 'status_id' })
	public statusId: number; // The status of the test result, e.g. passed or failed, also see get statuses

	@Expose({ name: 'test_id' })
	public testId: number; // The ID of the test this test result belongs to

	@Expose({ name: 'custom_step_results' })
	@Type(() => TRResultStep)
	public customStepResults?: TRResultStep[];

	@Expose({ name: 'attachment_ids' })
	public attachmentIds: number[]

	public id: number; // The unique ID of the test result
	public comment?: string; // The comment or error message of the test result
	public defects: string; // A comma-separated list of defects linked to the test result
	public elapsed?: string; // The amount of time it took to execute the test (e.g. "1m" or "2m 30s")
	public version: string; // The (build) version of the test was executed against
}

export class TRGetResultsApiPaginationResponse extends TRBaseApiPaginationResponse {
	@Type(() => TRResultDto)
	public results: TRResultDto[];
}
