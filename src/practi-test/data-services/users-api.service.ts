import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
	PTGetUserResponse,
	PTGetUsersOptions,
	PTNewUserData,
	PTUpdateUserData,
	PTUsersPaginationResponse,
} from 'src/practi-test/types/user.dto';
import { mockPtGetUserData, mockPtGetUsersData } from '../mockdata/mock-pt-get-users-data';
import { PTApiService } from 'src/practi-test/http/pt-api.service';
import { applyModelDecorators } from 'src/core/utils/model.utils';
import { PTGetUserProjectsPaginationResponse, PTUpdateUserProjectsData } from '../types/user-project.dto';
import { mockPtGetUserProjectsData } from '../mockdata/mock-pt-get-user-projects-data';
import { PTApiOptions } from '../types/general-types';
import { isNil, omitBy } from 'lodash';

export interface IPTUsersApiService {
	getUsers(options?: PTGetUsersOptions): Promise<PTUsersPaginationResponse>;
	createUser(userData: PTNewUserData): Promise<PTGetUserResponse>;
	updateUser(userId: string | number, userData: PTUpdateUserData): Promise<PTGetUserResponse>;
	getUserProjects(userId: string | number, options?: PTApiOptions): Promise<PTGetUserProjectsPaginationResponse>;
	updateUserProjects(userId: string | number, userProjectsData: PTUpdateUserProjectsData): Promise<unknown>;
}

@Injectable()
export class PTMockUsersApiService implements IPTUsersApiService {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getUsers = async (options?: PTGetUsersOptions): Promise<PTUsersPaginationResponse> => {
		const data = await mockPtGetUsersData();

		// const { data } = await mockPtGetUsersData();
		return plainToInstance(PTUsersPaginationResponse, data);
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public createUser = async (userData: PTNewUserData): Promise<PTGetUserResponse> => {
		const data = await mockPtGetUserData();

		return plainToInstance(PTGetUserResponse, data);
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public updateUser = async (userId: string | number, userData: PTUpdateUserData): Promise<PTGetUserResponse> => {
		const data = await mockPtGetUserData();

		return plainToInstance(PTGetUserResponse, data);
	};

	public getUserProjects = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		userId: string | number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: PTApiOptions,
	): Promise<PTGetUserProjectsPaginationResponse> => {
		const data = await mockPtGetUserProjectsData();

		return plainToInstance(PTGetUserProjectsPaginationResponse, data);
	};

	public updateUserProjects = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		userId: string | number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		userProjectsData: PTUpdateUserProjectsData,
	): Promise<unknown> => Promise.resolve();
}

@Injectable()
export class PTUsersApiService implements IPTUsersApiService {
	constructor(private readonly httpService: PTApiService) {}

	public getUsers = async (options?: PTGetUsersOptions): Promise<PTUsersPaginationResponse> => {
		const plainOptions = applyModelDecorators(PTGetUsersOptions, options);
		const params = {
			...omitBy(plainOptions?.filters, isNil),
			...plainOptions?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<PTUsersPaginationResponse>('users.json', { params });

		return plainToInstance(PTUsersPaginationResponse, data);
	};

	public createUser = async (userData: PTNewUserData): Promise<PTGetUserResponse> => {
		const body = {
			data: applyModelDecorators(PTNewUserData, userData),
		};
		const { data } = await this.httpService.axiosRef.post<PTGetUserResponse>('users.json', body);

		return plainToInstance(PTGetUserResponse, data);
	};

	public updateUser = async (userId: string | number, userData: PTUpdateUserData): Promise<PTGetUserResponse> => {
		const body = {
			data: applyModelDecorators(PTUpdateUserData, userData),
		};
		const { data } = await this.httpService.axiosRef.put<PTGetUserResponse>(`users/${userId}.json`, body);

		return plainToInstance(PTGetUserResponse, data);
	};

	public getUserProjects = async (
		userId: string | number,
		options?: PTApiOptions,
	): Promise<PTGetUserProjectsPaginationResponse> => {
		const plainOptions = applyModelDecorators(PTApiOptions, options);
		const params = {
			...plainOptions?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<PTGetUserProjectsPaginationResponse>(
			`users/${userId}/projects.json`,
			{ params },
		);

		return plainToInstance(PTGetUserProjectsPaginationResponse, data);
	};

	public updateUserProjects = async (
		userId: string | number,
		userProjectsData: PTUpdateUserProjectsData,
	): Promise<unknown> => {
		const body = {
			data: applyModelDecorators(PTUpdateUserProjectsData, userProjectsData),
		};
		const { data } = await this.httpService.axiosRef.put<unknown>(`users/${userId}/projects.json`, body);

		return data;
	};
}
