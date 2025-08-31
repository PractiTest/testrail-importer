import { Expose, Type } from 'class-transformer';
import { TRBaseApiPaginationResponse, TTRCustomField } from 'src/test-rail/types/general-types';

export class TRTestDto {
	[key: string]: TTRCustomField | undefined; // custom fields
	@Expose({ name: 'assignedto_id' })
	public assignedToId?: number; // The ID of the user the test is assigned to.

	@Expose({ name: 'case_id' })
	public caseId: number; // The ID of the related test case.

	@Expose({ name: 'estimate_forecast' })
	public estimateForecast?: string; // The estimated forecast of the related test case, e.g. “30s” or “1m 45s”

	@Expose({ name: 'milestone_id' })
	public milestoneId?: number; // The ID of the milestone that is linked to the test case.

	@Expose({ name: 'priority_id' })
	public priorityId?: number; // The ID of the priority that is linked to the test case.

	@Expose({ name: 'run_id' })
	public runId?: number; // The ID of the test run the test belongs to.

	@Expose({ name: 'status_id' })
	public statusId?: number; // The ID of the current status of the test.

	@Expose({ name: 'type_id' })
	public typeId: number; // The ID of the test case type that is linked to the test case.

	@Expose({ name: 'custom_expected' })
	public customExpected?: string;

	@Expose({ name: 'custom_steps' })
	public customSteps?: string;

	public id: number; // The unique ID of the test.
	public estimate?: string; // The estimate of the related test case, e.g. “30s” or “1m 45s”
	public refs?: string; // A comma-separated list of references/requirements that are linked to the test case.
	public title?: string; // The title of the related test case.
}

export class TRGetTestsApiPaginationResponse extends TRBaseApiPaginationResponse {
	@Type(() => TRTestDto)
	public tests: TRTestDto[];
}
