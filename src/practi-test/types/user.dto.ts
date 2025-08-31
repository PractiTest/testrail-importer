import {
	PTApiOptions,
	PTBaseApiPaginationResponse,
	PTBaseApiResponse,
	PTEntityBase,
} from 'src/practi-test/types/general-types';
import { Expose, Type } from 'class-transformer';

export class NewUserAttributes {
	@Expose({ name: 'first-name', toPlainOnly: true })
	public firstName?: string;

	@Expose({ name: 'last-name', toPlainOnly: true })
	public lastName?: string;

	@Expose({ name: 'display-name', toPlainOnly: true })
	public displayName: string;

	public email: string;
}

export class PTNewUserData {
	@Type(() => NewUserAttributes)
	public attributes: NewUserAttributes;
}

export class UpdateUserAttributes {
	@Expose({ name: 'first-name', toPlainOnly: true })
	public firstName?: string;

	@Expose({ name: 'last-name', toPlainOnly: true })
	public lastName?: string;

	@Expose({ name: 'display-name', toPlainOnly: true })
	public displayName: string;
}

export class PTUpdateUserData {
	@Type(() => UpdateUserAttributes)
	public attributes: UpdateUserAttributes;
}

class UserAttributes {
	@Expose({ name: 'first-name' })
	public firstName?: string;

	@Expose({ name: 'last-name' })
	public lastName?: string;

	@Expose({ name: 'display-name' })
	public displayName: string;

	@Expose({ name: 'time-zone' })
	public timezone: string;

	@Expose({ name: 'created-at' })
	public createdAt: string;

	public email: string;
}

export class PTUserDto extends PTEntityBase {
	@Type(() => UserAttributes)
	public attributes: UserAttributes;

	public type: 'users';
}

export class PTUsersFilters {
	public email?: string;
	public active?: string;
}
export class PTGetUsersOptions extends PTApiOptions {
	@Type(() => PTUsersFilters)
	public filters?: PTUsersFilters;
}

export class PTUsersPaginationResponse extends PTBaseApiPaginationResponse {
	@Type(() => PTUserDto)
	public data: PTUserDto[];
}

export class PTGetUserResponse extends PTBaseApiResponse {
	@Type(() => PTUserDto)
	public data: PTUserDto;
}
