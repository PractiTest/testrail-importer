import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockTrGetProjectsData } from 'src/test-rail/mockdata/mock-tr-get-projects-data';
import {
	TRGetProjectsOptions,
	TRGetProjectsApiPaginationResponse,
	TRProjectDto,
} from 'src/test-rail/types/project.dto';
import { TRApiService } from 'src/test-rail/http/tr-api.service';

export interface ITRProjectsApiService {
	getProjectById(projectId: number): Promise<TRProjectDto>;
	getAllProjects(options?: TRGetProjectsOptions): Promise<TRGetProjectsApiPaginationResponse | TRProjectDto[]>;
}

@Injectable()
export class TRMockProjectsApiService implements ITRProjectsApiService {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getProjectById = async (projectId: number): Promise<TRProjectDto> => {
		const data = await mockTrGetProjectsData();

		return plainToInstance(TRProjectDto, data);
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getAllProjects = async (options?: TRGetProjectsOptions): Promise<TRGetProjectsApiPaginationResponse> => {
		const data = await mockTrGetProjectsData();

		return plainToInstance(TRGetProjectsApiPaginationResponse, data);
	};
}

@Injectable()
export class TRProjectsApiService implements ITRProjectsApiService {
	constructor(private readonly httpService: TRApiService) {}

	public getProjectById = async (projectId: number): Promise<TRProjectDto> => {
		const { data } = await this.httpService.axiosRef.get<TRProjectDto>(`get_project/${projectId}`);

		return plainToInstance(TRProjectDto, data);
	};

	public getAllProjects = async (options?: TRGetProjectsOptions): Promise<TRGetProjectsApiPaginationResponse | TRProjectDto[]> => {
		const params = {
			...options?.pagination,
			...(options?.filters?.isCompleted ? { is_completed: options.filters.isCompleted.toString() } : {}),
		};
		const { data } = await this.httpService.axiosRef.get<TRGetProjectsApiPaginationResponse | TRProjectDto[]>(`get_projects`, {
			params,
		});

		if (Array.isArray(data)) {
			return plainToInstance(TRProjectDto, data);
		}

		return plainToInstance(TRGetProjectsApiPaginationResponse, data);
	};
}
