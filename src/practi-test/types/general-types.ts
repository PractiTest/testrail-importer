import { Expose, Type } from 'class-transformer';
import { PTUserDto } from 'src/practi-test/types/user.dto';
import { PTTestSetDto } from 'src/practi-test/types/testset.dto';
import { PTTestDto } from 'src/practi-test/types/test.dto';
import { PTRunDto } from 'src/practi-test/types/run.dto';
import { PTProjectDto } from 'src/practi-test/types/project.dto';
import { PTInstanceDto } from 'src/practi-test/types/instance.dto';
import { PTAttachmentDto } from 'src/practi-test/types/attachment.dto';
import { PTGroupDto } from './group.dto';
import { PTUserProjectDto } from './user-project.dto';
import { PTCustomFieldDto } from './custom-field.dto';
import { PTStepRunDto } from 'src/practi-test/types/step-run.dto';

export type TPTData =
	| PTUserDto
	| PTTestSetDto
	| PTTestDto
	| PTRunDto
	| PTProjectDto
	| PTInstanceDto
	| PTAttachmentDto
	| PTGroupDto
	| PTUserProjectDto
	| PTCustomFieldDto
	| PTStepRunDto;

export class PTBaseApiResponse {
	// @Type(() => PTEntityBase)
	public data: TPTData;
}

export class PTBaseApiArrayResponse {
	// @Type(() => PTEntityBase)
	public data: TPTData[];
}

class PTApiResponseMeta {
	@Expose({ name: 'current-page' })
	public currentPage: number;

	@Expose({ name: 'next-page' })
	public nextPage?: number;

	@Expose({ name: 'prev-page' })
	public prevPage?: number;

	@Expose({ name: 'total-pages' })
	public totalPages: number;

	@Expose({ name: 'total-count' })
	public totalCount: number;
}

export class PTBaseApiPaginationResponse {
	@Type(() => PTApiResponseMeta)
	public meta: PTApiResponseMeta;

	public data: TPTData[];
	public links: {
		self: string;
		next?: string;
		last: string;
	};
}

export class PTEntityBase {
	public id: string;
	public type: string;
	public attributes: {
		[key: string]: any;
	};
}

export interface IPTCustomFields {
	[key: string]: any;
}

export class PTPagination {
	@Expose({ name: 'page[number]', toPlainOnly: true })
	public pageNumber: number;

	@Expose({ name: 'page[size]', toPlainOnly: true })
	public pageSize: number;
}

export class PTApiOptions {
	@Type(() => PTPagination)
	public pagination?: PTPagination;

	public filters?: any;
}
