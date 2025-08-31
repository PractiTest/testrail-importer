import { Expose, Type } from 'class-transformer';
import { PTUpdateUserProjectGroups } from 'src/practi-test/types/user-project.dto';
import { TRBaseApiPaginationResponse } from 'src/test-rail/types/general-types';

export enum TRUserRole {
	TESTER = 'Tester',
	LEAD = 'Lead',
}

export class TRUserDto {
	@Expose({ name: 'email_notifications' })
	public emailNotifications: boolean;

	@Expose({ name: 'is_active' })
	public isActive: boolean;

	@Expose({ name: 'is_admin' })
	public isAdmin?: boolean; // does not work for get_users

	@Expose({ name: 'role_id' })
	public roleId?: number;

	@Expose({ name: 'group_ids' })
	public groupIds?: number[];

	@Expose({ name: 'mfa_required' })
	public mfaRequired?: boolean;

	@Expose({ name: 'sso_enabled' })
	public ssoEnabled?: boolean | undefined; // only for TestRail Enterprise

	@Expose({ name: 'assigned_projects' })
	public assignedProjects?: number[] | undefined; // only for TestRail Enterprise

	public id: number;
	public email: string;
	public name: string;
	public role: string;
}

export type TRGetUsersApiResponse = TRUserDto[];

export class TRGetUsersApiPaginationResponse extends TRBaseApiPaginationResponse {
	@Type(() => TRUserDto)
	public users: TRUserDto[];
}

export interface TRUserMigrationData {
	isNew: boolean;
	projects?: PTUpdateUserProjectGroups[];
}
