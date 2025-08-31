import {
	IPTCustomFields,
	PTApiOptions,
	PTBaseApiPaginationResponse,
	PTBaseApiResponse,
	PTEntityBase,
} from 'src/practi-test/types/general-types';
import { Expose, Transform, Type } from 'class-transformer';

export class PTNewTestSetAttributes {
	@Expose({ name: 'assigned-to-id', toPlainOnly: true })
	public assignedToId?: number | null;

	@Expose({ name: 'author-id', toPlainOnly: true })
	public authorId?: number;

	@Expose({ name: 'assigned-to-type', toPlainOnly: true })
	public assignedToType?: any; // Not provided in API docs

	@Expose({ name: 'planned-execution', toPlainOnly: true })
	public plannedExecution?: string; // ISO Date 2017-03-01T12:43:31Z

	@Expose({ name: 'custom-fields', toPlainOnly: true })
	public customFields?: IPTCustomFields;

	@Expose({ name: 'test-ids', toPlainOnly: true }) // an array of test-ids to add as instances to the new TestSet
	public testIds?: number[];

	public name: string;
	public description?: string; // Not provided in API docs
	public status?: string;
	public version?: string;
	public priority?: string;
	public tags?: string[];
}

export class PTNewTestSetData {
	@Type(() => PTNewTestSetAttributes)
	public attributes: PTNewTestSetAttributes;
}

export class PTUpdateTestSetAttributes {
	@Expose({ name: 'assigned-to-id', toPlainOnly: true })
	public assignedToId?: number;

	@Expose({ name: 'assigned-to-type', toPlainOnly: true })
	public assignedToType?: any; // Not provided in API docs

	@Expose({ name: 'planned-execution', toPlainOnly: true })
	public plannedExecution?: string; // ISO Date 2017-03-01T12:43:31Z

	@Expose({ name: 'custom-fields', toPlainOnly: true })
	public customFields?: IPTCustomFields;

	public name?: string;
	public description?: string; // Not provided in API docs
	public version?: string;
	public priority?: string;
	public tags?: string[];
}
export class PTUpdateTestSetData {
	@Type(() => PTUpdateTestSetAttributes)
	public attributes: PTUpdateTestSetAttributes;
}

export class TestSetAttributes {
	@Expose({ name: 'project-id' })
	public projectId?: number;

	@Expose({ name: 'display-id' })
	public displayId?: number;

	@Expose({ name: 'instances-count' })
	public instancesCount: number;

	@Expose({ name: 'run-status' })
	public runStatus: string;

	@Expose({ name: 'last-run' })
	public lastRun: string;

	@Expose({ name: 'assigned-to-id' })
	public assignedToId?: number;

	@Expose({ name: 'assigned-to-type' })
	public assignedToType?: any; // Not provided in API docs

	@Expose({ name: 'planned-execution' })
	public plannedExecution?: any; // Not provided in API docs

	@Expose({ name: 'custom-fields' })
	public customFields: IPTCustomFields;

	@Expose({ name: 'folder-id' })
	public folderId?: any; // Not provided in API docs

	@Expose({ name: 'created-at' })
	public createdAt: string;

	@Expose({ name: 'updated-at' })
	public updatedAt?: string;

	public name: string;
	public description: string;
	public version?: any; // Not provided in API docs
	public priority?: any; // Not provided in API docs
}

export class PTTestSetDto extends PTEntityBase {
	@Type(() => TestSetAttributes)
	public attributes: TestSetAttributes;

	public type: 'sets';
}

export class PTUTestSetsFilters {
	@Expose({ name: 'filter-id', toPlainOnly: true })
	public filterId?: number;

	@Expose({ name: 'autofilter-value', toPlainOnly: true })
	public autofilterValue?: number;

	@Expose({ name: 'sub-autofilter-value', toPlainOnly: true })
	public subAutofilterValue?: number;

	@Expose({ name: 'filter-user-id', toPlainOnly: true })
	public filterUserId?: number;

	@Expose({ name: 'display-ids', toPlainOnly: true })
	@Transform(({ value }: { value?: string[] | number[] }) => value?.join(','), { toPlainOnly: true })
	public displayIds?: string[] | number[];

	@Expose({ name: 'name_exact', toPlainOnly: true })
	public nameExact?: string;

	@Expose({ name: 'name_like', toPlainOnly: true })
	public nameLike?: string;
}
export class PTGetTestSetsOptions extends PTApiOptions {
	@Type(() => PTUTestSetsFilters)
	public filters?: PTUTestSetsFilters;
}

export class PTGetTestSetsPaginationResponse extends PTBaseApiPaginationResponse {
	@Type(() => PTTestSetDto)
	public data: PTTestSetDto[];
}

export class PTGetTestSetResponse extends PTBaseApiResponse {
	@Type(() => PTTestSetDto)
	public data: PTTestSetDto;
}
