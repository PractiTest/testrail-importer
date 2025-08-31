import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockPtGetSpecificProjectData } from 'src/practi-test/mockdata/mock-pt-get-specific-project-data';
import { PTGetProjectResponse, PTGetProjectsPaginationResponse } from 'src/practi-test/types/project.dto';
import { PTApiOptions } from '../types/general-types';
import { mockPtGetAllProjectsData } from '../mockdata/mock-pt-get-projects-data';
import { PTApiService } from 'src/practi-test/http/pt-api.service';
import { applyModelDecorators } from 'src/core/utils/model.utils';

interface IPTProjectsApiService {
	getAllProjects(options?: PTApiOptions): Promise<PTGetProjectsPaginationResponse>;
	getProjectById(id: number): Promise<PTGetProjectResponse>;
}

@Injectable()
export class PTMockProjectsApiService implements IPTProjectsApiService {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getAllProjects = async (options?: PTApiOptions): Promise<PTGetProjectsPaginationResponse> => {
		const data = await mockPtGetAllProjectsData();

		return plainToInstance(PTGetProjectsPaginationResponse, data);
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getProjectById = async (id: number): Promise<PTGetProjectResponse> => {
		const data = await mockPtGetSpecificProjectData();

		return plainToInstance(PTGetProjectResponse, data);
	};
}

@Injectable()
export class PTProjectsApiService implements IPTProjectsApiService {
	constructor(private readonly httpService: PTApiService) {}

	public getAllProjects = async (options?: PTApiOptions): Promise<PTGetProjectsPaginationResponse> => {
		const plainOptions = applyModelDecorators(PTApiOptions, options);
		const params = {
			...plainOptions?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<PTGetProjectsPaginationResponse>('projects.json', { params });

		return plainToInstance(PTGetProjectsPaginationResponse, data);
	};

	public getProjectById = async (id: number): Promise<PTGetProjectResponse> => {
		const { data } = await this.httpService.axiosRef.get<PTGetProjectResponse>(`projects/${id}.json`);

		return plainToInstance(PTGetProjectResponse, data);
	};
}
