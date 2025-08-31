import {
	IPTCustomFields,
	PTApiOptions,
	PTBaseApiArrayResponse,
	PTBaseApiPaginationResponse,
	PTBaseApiResponse,
	PTEntityBase,
} from 'src/practi-test/types/general-types';
import { Expose, Transform, Type } from 'class-transformer';

export class PTNewInstanceAttributes {
	@Expose({ name: 'set-id', toPlainOnly: true })
	public setId: number;

	@Expose({ name: 'test-id', toPlainOnly: true })
	public testId: number;

	@Expose({ name: 'planned-execution', toPlainOnly: true })
	public plannedExecution?: string; // ISO Date 2017-03-01T12:43:31Z

	@Expose({ name: 'assigned-to-id', toPlainOnly: true })
	public assignedToId?: number;

	@Expose({ name: 'assigned-to-type', toPlainOnly: true })
	public assignedToType?: any; // Not provided in API docs

	@Expose({ name: 'custom-fields', toPlainOnly: true })
	public customFields?: IPTCustomFields;

	public version?: any; // Not provided in API docs
	public priority?: any; // Not provided in API docs
}

export class PTNewInstanceData {
	@Type(() => PTNewInstanceAttributes)
	public attributes: PTNewInstanceAttributes;
}

export class PTUpdateInstanceAttributes {
	@Expose({ name: 'planned-execution', toPlainOnly: true })
	public plannedExecution?: string; // ISO Date 2017-03-01T12:43:31Z

	@Expose({ name: 'assigned-to-id', toPlainOnly: true })
	public assignedToId?: number;

	@Expose({ name: 'assigned-to-type', toPlainOnly: true })
	public assignedToType?: any; // Not provided in API docs

	@Expose({ name: 'custom-fields', toPlainOnly: true })
	public customFields?: IPTCustomFields;

	public version?: any; // Not provided in API docs
	public priority?: any; // Not provided in API docs
}

export class PTUpdateInstanceData {
	@Type(() => PTUpdateInstanceAttributes)
	public attributes: PTUpdateInstanceAttributes;
}

export class InstanceAttributes {
	@Expose({ name: 'last-run-duration' })
	public lastRunDuration: string; //  "00:00:00"

	@Expose({ name: 'project-id' })
	public projectId?: number;

	@Expose({ name: 'set-id' })
	public setId: number;

	@Expose({ name: 'set-display-id' })
	public setDisplayId: number;

	@Expose({ name: 'test-id' })
	public testId: number;

	@Expose({ name: 'test-display-id' })
	public testDisplayId: number;

	@Expose({ name: 'custom-fields' })
	public customFields: IPTCustomFields;

	@Expose({ name: 'display-id' })
	public displayId: string;

	@Expose({ name: 'tester-id' })
	public testerId: number;

	@Expose({ name: 'last-run' })
	public lastRun: string; // ISO date

	@Expose({ name: 'run-status' })
	public runStatus: string;

	@Expose({ name: 'planned-execution' })
	public plannedExecution?: any; // Not provided in API docs

	@Expose({ name: 'assigned-to-id' })
	public assignedToId?: number;

	@Expose({ name: 'assigned-to-type' })
	public assignedToType?: any; // Not provided in API docs

	@Expose({ name: 'created-at' })
	public createdAt: string;

	@Expose({ name: 'updated-at' })
	public updatedAt?: string;

	public name: string;
	public priority?: any; // Not provided in API docs
	public version?: any; // Not provided in API docs
}

export class PTInstanceDto extends PTEntityBase {
	@Type(() => InstanceAttributes)
	public attributes: InstanceAttributes;

	public type: 'instances';
}

export class PTUInstancesFilters {
	@Expose({ name: 'set-filter-id', toPlainOnly: true })
	public setFilterId?: number;

	@Expose({ name: 'set-filter-user-id', toPlainOnly: true })
	public setFilterUserId?: number;

	@Expose({ name: 'test-ids', toPlainOnly: true })
	@Transform(({ value }: { value?: string[] | number[] }) => value?.join(','), { toPlainOnly: true })
	public testIds?: string[] | number[];

	@Expose({ name: 'set-ids', toPlainOnly: true })
	@Transform(({ value }: { value?: string[] | number[] }) => value?.join(','), { toPlainOnly: true })
	public setIds?: string[] | number[];

	@Expose({ name: 'name_exact', toPlainOnly: true })
	public nameExact?: string;

	@Expose({ name: 'name_like', toPlainOnly: true })
	public nameLike?: string;

	@Expose({ name: 'display-id', toPlainOnly: true })
	public displayId?: string;

	@Expose({ name: 'test-display-ids', toPlainOnly: true })
	@Transform(({ value }: { value?: string[] | number[] }) => value?.join(','), { toPlainOnly: true })
	public testDisplayIds?: string[] | number[];
}
export class PTGetInstancesOptions extends PTApiOptions {
	@Type(() => PTUInstancesFilters)
	public filters?: PTUInstancesFilters;
}

export class PTGetInstancesPaginationResponse extends PTBaseApiPaginationResponse {
	@Type(() => PTInstanceDto)
	public data: PTInstanceDto[];
}

export class PTGetInstanceResponse extends PTBaseApiResponse {
	@Type(() => PTInstanceDto)
	public data: PTInstanceDto;
}

export class PTGetInstancesResponse extends PTBaseApiArrayResponse {
	@Type(() => PTInstanceDto)
	public data: PTInstanceDto[];
}
