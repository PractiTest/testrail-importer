import { TRGetUsersApiPaginationResponse, TRUserDto } from 'src/test-rail/types/user.dto';
import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';

export const trUsers = plainToInstance(TRUserDto, [
	{
		id: 1,
		email: 'john.doe@gurock.io',
		email_notifications: true,
		is_active: true,
		is_admin: false,
		name: 'John Doe',
		role_id: 3,
		role: 'Tester',
		group_ids: [1, 2, 3],
		mfa_required: false,
	},
	{
		id: 2,
		email: 'jane.doe@gurock.io',
		email_notifications: true,
		is_active: true,
		is_admin: false,
		name: 'Jane Doe',
		role_id: 3,
		role: 'Tester',
		group_ids: [1, 2, 3],
		mfa_required: false,
	},
	{
		id: 3,
		email: 'jason.doe@gurock.io',
		email_notifications: true,
		is_active: true,
		is_admin: false,
		name: 'Jason Doe',
		role_id: 3,
		role: 'Tester',
		group_ids: [1, 2, 3],
		mfa_required: false,
	},
	{
		id: 4,
		email: 'john.smith@gurock.io',
		email_notifications: true,
		is_active: true,
		is_admin: false,
		name: 'John Smith',
		role_id: 3,
		role: 'Tester',
		group_ids: [1, 2, 3],
		mfa_required: false,
	},
	{
		id: 5,
		email: 'jacob.black@gurock.io',
		email_notifications: true,
		is_active: true,
		is_admin: false,
		name: 'Jacob Black',
		role_id: 3,
		role: 'Tester',
		group_ids: [1, 2, 3],
		mfa_required: false,
	},
]);

const mockTRUsersResponse = {
	offset: 0,
	limit: 0,
	size: 5,
	_links: {
		next: null,
		prev: null
	},
	users: trUsers
};
export const mockTrGetUsersData = mockApiFactory<TRGetUsersApiPaginationResponse>(mockTRUsersResponse);
