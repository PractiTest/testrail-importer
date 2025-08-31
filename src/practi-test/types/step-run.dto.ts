import {
	PTApiOptions,
	PTBaseApiPaginationResponse,
	PTEntityBase,
} from 'src/practi-test/types/general-types';
import { Expose, Transform, Type } from 'class-transformer';
import { PTRunStepStatus } from 'src/practi-test/types/run.dto';

class StepRunAttributes {
	@Expose({ name: 'project-id' })
	public projectId: number;

	@Expose({ name: 'run-id' })
	public runId: number;

	public name: string;
	public description: string;

	@Expose({ name: 'expected-results' })
	public expectedResults?: string | null;

	@Expose({ name: 'actual-results' })
	public actualResults?: string | null;

	public status: PTRunStepStatus; // TODO add enum

	public position: number;

	@Expose({ name: 'created-at' })
	public createdAt: string;

	@Expose({ name: 'updated-at' })
	public updatedAt: string;
}

export class PTStepRunDto extends PTEntityBase {
	@Type(() => StepRunAttributes)
	public attributes: StepRunAttributes;

	public type: 'step-runs';
}

export class PTStepRunFilters {
	@Expose({ name: 'run-ids', toPlainOnly: true })
	@Transform(({ value }: { value?: number[] | string[] }) => value?.join(','), { toPlainOnly: true })
	public runIds?: string[];

	@Expose({ name: 'name_exact', toPlainOnly: true })
	public nameExact?: string;

	@Expose({ name: 'name_like', toPlainOnly: true })
	public nameLike?: string;

	public status?: PTRunStepStatus;
}
export class PTGetStepRunOptions extends PTApiOptions {
	@Type(() => PTStepRunFilters)
	public filters?: PTStepRunFilters;
}

export class PTGetStepRunsPaginationResponse extends PTBaseApiPaginationResponse {
	@Type(() => PTStepRunDto)
	public data: PTStepRunDto[];
}
