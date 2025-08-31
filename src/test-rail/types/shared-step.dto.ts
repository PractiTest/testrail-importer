import { Expose, Transform, Type } from 'class-transformer';
import { TRApiOptions, TRBaseApiPaginationResponse } from 'src/test-rail/types/general-types';

export class TRSharedCaseStepSeparated {
	@Expose({ name: 'additional_info' })
	public additionalInfo?: string;

	public content: string;
	public expected: string;
	public refs?: string;
}

export class TRSharedStepDto {
	@Expose({ name: 'project_id' })
	public projectId: number;

	@Expose({ name: 'created_by' })
	public createdBy: number;

	@Expose({ name: 'created_on' })
	public createdOn: number;

	@Expose({ name: 'updated_by' })
	public updatedBy: number;

	@Expose({ name: 'updated_on' })
	public updatedOn: number;

	@Expose({ name: 'custom_steps_separated' })
	@Type(() => TRSharedCaseStepSeparated)
	public customStepsSeparated: TRSharedCaseStepSeparated[];

	public id: number;
	public title: string;
}

export class TRGetSharedStepsApiPaginationResponse extends TRBaseApiPaginationResponse {
	@Expose({ name: 'shared_steps' })
	@Type(() => TRSharedStepDto)
	public sharedSteps: TRSharedStepDto[];
}

export class TRSharedStepsFilters {
	@Expose({ name: 'created_after', toPlainOnly: true })
	public createdAfter?: number; // timestamp

	@Expose({ name: 'created_before', toPlainOnly: true })
	public createdBefore?: number;

	@Expose({ name: 'created_by', toPlainOnly: true })
	@Transform(({ value }: { value?: number[] }) => value?.join(','), { toPlainOnly: true })
	public createdBy?: number[]; // A comma-separated list of creators (user IDs) to filter by

	@Expose({ name: 'updated_after', toPlainOnly: true })
	public updatedAfter?: number; // timestamp

	@Expose({ name: 'updated_before', toPlainOnly: true })
	public updatedBefore?: number; // timestamp

	public refs?: string; // A single Reference ID (e.g. TR-a, 4291, etc.)
}
export class TRGetSharedStepsOptions extends TRApiOptions {
	@Type(() => TRSharedStepsFilters)
	public filters?: TRSharedStepsFilters;
}
