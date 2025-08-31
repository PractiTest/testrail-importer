import { Expose, Type } from 'class-transformer';
import { TRBaseApiPaginationResponse, ITRApiOptions } from 'src/test-rail/types/general-types';

export enum ProjectSuiteMode {
	SINGLE_SUITE = 1,
	SINGLE_SUITE_BASELINE = 2,
	MULTI_SUITE = 3
}

export class TRProjectUser {
	@Expose({ name: 'global_role_id' })
	public globalRoleId?: number;

	@Expose({ name: 'global_role' })
	public globalRole?: string;

	@Expose({ name: 'project_role_id' })
	public projectRoleId?: number;

	@Expose({ name: 'project_role' })
	public projectRole?: string;

	@Expose({ name: 'user_id' }) // TODO: test on different versions. API docs: 'id', real data: 'user_id'
	public userId: number;
}

export class TRProjectGroup {
	@Expose({ name: 'role_id' })
	public roleId: number;

	public id: number;
	public role: string;
}

export class TRProjectDto {
	@Expose({ name: 'completed_on' })
	public completedOn: number;

	@Expose({ name: 'default_role_id' })
	public defaultRoleId: number;

	@Expose({ name: 'default_role' })
	public defaultRole: string;

	@Expose({ name: 'is_completed' })
	public isCompleted: boolean;

	@Expose({ name: 'show_announcement' })
	public showAnnouncement: boolean;

	// 	The suite mode of the project (1 for single suite mode, 2 for single suite + baselines, 3 for multiple suites)
	@Expose({ name: 'suite_mode' })
	public suiteMode: ProjectSuiteMode;

	@Type(() => TRProjectUser)
	public users: TRProjectUser[];

	@Type(() => TRProjectGroup)
	public groups: TRProjectGroup[];

	public id: number;
	public announcement: string;
	public name: string;
	public url: string;
}

export class TRGetProjectsApiPaginationResponse extends TRBaseApiPaginationResponse {
	@Type(() => TRProjectDto)
	public projects: TRProjectDto[];
}

export interface TRGetProjectsOptions extends ITRApiOptions {
	filters?: {
		isCompleted?: boolean;
	};
}
