import { PTBaseApiPaginationResponse, PTEntityBase } from 'src/practi-test/types/general-types';
import { Expose, Type } from 'class-transformer';

export class PTGroupAttributes {
	@Expose({ name: 'created-at' })
	public createdAt: string; // ISO Date

	public name: string;
}

export class PTGroupDto extends PTEntityBase {
	@Type(() => PTGroupAttributes)
	public attributes: PTGroupAttributes;

	public type: 'groups';
}

export class PTGetGroupsPaginationResponse extends PTBaseApiPaginationResponse {
	@Type(() => PTGroupDto)
	public data: PTGroupDto[];
}

export enum PTDefaultGroupName {
	ADMINISTRATORS = 'Administrators',
	TESTERS = 'Testers',
	DEVELOPERS = 'Developers',
	COMMENTERS = 'Commenters',
}
