import { Expose, Transform, Type } from 'class-transformer';
import { TRApiOptions, TRBaseApiPaginationResponse, TTRCustomField } from 'src/test-rail/types/general-types';
import { PTTestStepMigrationData } from 'src/practi-test/types/test.dto';

export class TRCaseStepSeparated {
	// for shared steps
	@Expose({ name: 'shared_step_id' })
	public sharedStepId?: number;

	// for common steps
	public content?: string;
	public expected?: string;
}

export class TRCaseDto {
	[key: string]: TTRCustomField | undefined; // custom fields

	@Expose({ name: 'section_id' })
	public sectionId: number;

	@Expose({ name: 'template_id' })
	public templateId: number;

	@Expose({ name: 'type_id' })
	public typeId: number; // The ID of the test case type that is linked to the test case

	@Expose({ name: 'priority_id' })
	public priorityId: number;

	@Expose({ name: 'milestone_id' })
	public milestoneId?: number;

	@Expose({ name: 'created_by' })
	public createdBy: number; // The ID of the user who created the test case

	@Expose({ name: 'created_on' })
	public createdOn: number; // The date/time when the test case was created (as UNIX timestamp)

	@Expose({ name: 'updated_by' })
	public updatedBy?: number; // The ID of the user who last updated the test case

	@Expose({ name: 'updated_on' })
	public updatedOn?: number; // The date/time when the test case was last updated (as UNIX timestamp)

	@Expose({ name: 'estimate_forecast' })
	public estimateForecast?: string; // The estimate forecast, e.g. “30s” or “1m 45s” (timespan)

	@Expose({ name: 'suite_id' })
	public suiteId: number;

	@Expose({ name: 'display_order' })
	public displayOrder?: number | undefined; // ToDo: test it

	@Expose({ name: 'is_deleted' })
	public isDeleted?: number | undefined; // ToDo: test it https://support.testrail.com/hc/en-us/articles/7077292642580-Cases

	@Expose({ name: 'custom_steps' })
	public customSteps?: string;

	@Expose({ name: 'custom_expected' })
	public customExpected?: string;

	@Expose({ name: 'custom_steps_separated' })
	@Type(() => TRCaseStepSeparated)
	public customStepsSeparated?: TRCaseStepSeparated[];

	public id: number;
	public title: string;
	public refs?: string; // A comma-separated list of references/requirements that are linked to the test case
	public estimate?: string; // The estimate, e.g. “30s” or “1m 45s” (timespan)
}

export class TRGetCasesApiPaginationResponse extends TRBaseApiPaginationResponse {
	@Type(() => TRCaseDto)
	public cases: TRCaseDto[];
}

export class TRCasesFilters {
	@Expose({ name: 'created_after', toPlainOnly: true })
	public createdAfter?: number; // timestamp

	@Expose({ name: 'created_before', toPlainOnly: true })
	public createdBefore?: number;

	@Expose({ name: 'created_by', toPlainOnly: true })
	@Transform(({ value }: { value?: number[] }) => value?.join(','), { toPlainOnly: true })
	public createdBy?: number[]; // A comma-separated list of creators (user IDs) to filter by

	@Expose({ name: 'milestone_id', toPlainOnly: true })
	@Transform(({ value }: { value?: number[] }) => value?.join(','), { toPlainOnly: true })
	public milestoneId?: number[];

	@Expose({ name: 'priority_id', toPlainOnly: true })
	@Transform(({ value }: { value?: number[] }) => value?.join(','), { toPlainOnly: true })
	public priorityId?: number[];

	@Expose({ name: 'section_id', toPlainOnly: true })
	public sectionId?: number;

	@Expose({ name: 'template_id', toPlainOnly: true })
	@Transform(({ value }: { value?: number[] }) => value?.join(','), { toPlainOnly: true })
	public templateId?: number[];

	@Expose({ name: 'type_id', toPlainOnly: true })
	@Transform(({ value }: { value?: number[] }) => value?.join(','), { toPlainOnly: true })
	public typeId?: number[];

	@Expose({ name: 'updated_after', toPlainOnly: true })
	public updatedAfter?: number; // timestamp

	@Expose({ name: 'updated_before', toPlainOnly: true })
	public updatedBefore?: number; // timestamp

	@Expose({ name: 'updated_by', toPlainOnly: true })
	public updatedBy?: number;

	/* @Expose({ name: 'suite_id', toPlainOnly: true })
	public suiteId?: number; */

	public filter?: string; // Only return cases with matching filter string in the case title
	public refs?: string;
}
export class TRGetCasesOptions extends TRApiOptions {
	@Type(() => TRCasesFilters)
	public filters?: TRCasesFilters;
}

export interface TRCaseMigrationData {
	sectionPath?: string;
	ptAuthorId: number;
	stepsData: PTTestStepMigrationData[];
}
