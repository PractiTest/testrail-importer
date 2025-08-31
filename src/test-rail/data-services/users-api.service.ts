import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockTrGetUsersData } from 'src/test-rail/mockdata/mock-tr-get-users-data';
import { TRGetUsersApiPaginationResponse, TRUserDto } from 'src/test-rail/types/user.dto';
import { TRApiService } from 'src/test-rail/http/tr-api.service';
import { TRApiOptions } from 'src/test-rail/types/general-types';

export interface ITRUsersApiService {
	getUsersByProjectId(projectId: number, options?: TRApiOptions): Promise<TRGetUsersApiPaginationResponse>;
}

@Injectable()
export class TRMockUsersApiService implements ITRUsersApiService {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getUsersByProjectId = async (projectId: number): Promise<TRGetUsersApiPaginationResponse> => {
		const data = await mockTrGetUsersData();

		return plainToInstance(TRGetUsersApiPaginationResponse, data);
	};
}

@Injectable()
export class TRUsersApiService implements ITRUsersApiService {
	constructor(private readonly httpService: TRApiService) {}

	// public getUsersByProjectId = async (projectId: number): Promise<TRUserDto[]> => {
	// 	const { data } = await this.httpService.axiosRef.get<TRGetUsersApiResponse>(`get_users/${projectId}`);
	//
	// 	return plainToInstance(TRUserDto, data);
	// };


	public getUsersByProjectId = async (
		projectId: number,
		options?: TRApiOptions,
	): Promise<TRGetUsersApiPaginationResponse> => {
		const params = {
			...options?.pagination,
		};

		const { data } = await this.httpService.axiosRef.get<TRGetUsersApiPaginationResponse | TRUserDto[]>(`get_users/${projectId}`, {
			params,
		});

		if (Array.isArray(data)) {
			return plainToInstance(TRGetUsersApiPaginationResponse, { users: data });
		}

		return plainToInstance(TRGetUsersApiPaginationResponse, data);
	};
}
