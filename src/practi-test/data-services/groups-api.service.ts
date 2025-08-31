import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { PTGetGroupsPaginationResponse } from 'src/practi-test/types/group.dto';
import { mockPtGetGroupsData } from 'src/practi-test/mockdata/mock-pt-get-groups-data';
import { PTApiService } from 'src/practi-test/http/pt-api.service';
import { PTApiOptions } from '../types/general-types';
import { applyModelDecorators } from 'src/core/utils/model.utils';

interface IPTGroupsApiService {
	getGroupsByProjectId(projectId: number, options?: PTApiOptions): Promise<PTGetGroupsPaginationResponse>;
}

@Injectable()
export class PTMockGroupsApiService implements IPTGroupsApiService {
	public getGroupsByProjectId = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: PTApiOptions,
	): Promise<PTGetGroupsPaginationResponse> => {
		const data = await mockPtGetGroupsData();

		return plainToInstance(PTGetGroupsPaginationResponse, data);
	};
}

@Injectable()
export class PTGroupsApiService implements IPTGroupsApiService {
	constructor(private readonly httpService: PTApiService) {}

	public getGroupsByProjectId = async (
		projectId: number,
		options?: PTApiOptions,
	): Promise<PTGetGroupsPaginationResponse> => {
		const plainOptions = applyModelDecorators(PTApiOptions, options);
		const params = {
			...plainOptions?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<PTGetGroupsPaginationResponse>(
			`projects/${projectId}/groups.json`,
			{
				params,
			},
		);

		return plainToInstance(PTGetGroupsPaginationResponse, data);
	};
}
