import { PTProjectAttributes } from 'src/practi-test/types/project.dto';
import { PTBaseApiPaginationResponse, PTEntityBase } from './general-types';
import { Type } from 'class-transformer';

interface PTUpdateUserProjectGroupId {
	id: number;
}

export interface PTUpdateUserProjectGroups {
	id: number;
	groups: PTUpdateUserProjectGroupId[];
}

export class PTUpdateUserProjectsData {
	public projects: PTUpdateUserProjectGroups[];
}

interface PTUserProjectGroup {
	id: number;
	name: string;
}

export class PTUserProjectAttributes extends PTProjectAttributes {
	public groups: PTUserProjectGroup[];
}

export class PTUserProjectDto extends PTEntityBase {
	@Type(() => PTUserProjectAttributes)
	public attributes: PTUserProjectAttributes;

	public type: 'projects';
}
export class PTGetUserProjectsPaginationResponse extends PTBaseApiPaginationResponse {
	@Type(() => PTUserProjectDto)
	public data: PTUserProjectDto[];
}
