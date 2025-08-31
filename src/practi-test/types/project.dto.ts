import { PTBaseApiPaginationResponse, PTBaseApiResponse, PTEntityBase } from 'src/practi-test/types/general-types';
import { Expose, Type } from 'class-transformer';

export class PTProjectAttributes {
	@Expose({ name: 'created-at' })
	public createdAt: string;

	@Expose({ name: 'automation-support' })
	public automationSupport: boolean;

	@Expose({ name: 'enable-delete-issues' })
	public enableDeleteIssues: boolean;

	@Expose({ name: 'time-management-support' })
	public timeManagementSupport: boolean;

	public name: string;
}

export class PTProjectDto extends PTEntityBase {
	@Type(() => PTProjectAttributes)
	public attributes: PTProjectAttributes;

	public type: 'projects';
}

export class PTGetProjectsPaginationResponse extends PTBaseApiPaginationResponse {
	@Type(() => PTProjectDto)
	public data: PTProjectDto[];
}

export class PTGetProjectResponse extends PTBaseApiResponse {
	@Type(() => PTProjectDto)
	public data: PTProjectDto;
}
