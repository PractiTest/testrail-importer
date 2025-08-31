import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockPtGetRunData, mockPtGetRunsData } from 'src/practi-test/mockdata/mock-pt-get-runs-data';
import {
	PTGetRunResponse,
	PTGetRunsOptions,
	PTGetRunsPaginationResponse,
	PTGetRunsResponse,
	PTNewRunData,
} from 'src/practi-test/types/run.dto';
import { PTApiService } from 'src/practi-test/http/pt-api.service';
import { applyModelDecorators } from 'src/core/utils/model.utils';
import { isNil, omitBy } from 'lodash';
import { PTGetStepRunOptions, PTGetStepRunsPaginationResponse } from 'src/practi-test/types/step-run.dto';

interface IPTRunsApiService {
	getRunsByProjectId(projectId: number, options?: PTGetRunsOptions): Promise<PTGetRunsPaginationResponse>;
	createRun(projectId: number, runData: PTNewRunData): Promise<PTGetRunResponse>;
}

@Injectable()
export class PTMockRunsApiService implements IPTRunsApiService {
	public getRunsByProjectId = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: PTGetRunsOptions,
	): Promise<PTGetRunsPaginationResponse> => {
		const data = await mockPtGetRunsData();

		return plainToInstance(PTGetRunsPaginationResponse, data);
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public createRun = async (projectId: number, runData: PTNewRunData): Promise<PTGetRunResponse> => {
		const data = await mockPtGetRunData();

		return plainToInstance(PTGetRunResponse, data);
	};
}

@Injectable()
export class PTRunsApiService implements IPTRunsApiService {
	constructor(private readonly httpService: PTApiService) {}

	public getRunsByProjectId = async (
		projectId: number,
		options?: PTGetRunsOptions,
	): Promise<PTGetRunsPaginationResponse> => {
		const plainOptions = applyModelDecorators(PTGetRunsOptions, options);
		const params = {
			...omitBy(plainOptions?.filters, isNil),
			...plainOptions?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<PTGetRunsPaginationResponse>(
			`projects/${projectId}/runs.json`,
			{
				params,
			},
		);

		return plainToInstance(PTGetRunsPaginationResponse, data);
	};

	public createRun = async (projectId: number, runData: PTNewRunData): Promise<PTGetRunResponse> => {
		const body = {
			data: applyModelDecorators(PTNewRunData, runData),
		};
		const { data } = await this.httpService.axiosRef.post<PTGetRunResponse>(`projects/${projectId}/runs.json`, body);

		return plainToInstance(PTGetRunResponse, data);
	};

	public bulkCreateRuns = async (projectId: number, runsData: PTNewRunData[]): Promise<PTGetRunsResponse> => {
		const body = {
			data: applyModelDecorators(PTNewRunData, runsData),
		};
		const { data } = await this.httpService.axiosRef.post<PTGetRunsResponse>(`projects/${projectId}/runs.json`, body);

		return plainToInstance(PTGetRunsResponse, data);
	};




	public getStepRunsByProjectId = async (
		projectId: number,
		options?: PTGetStepRunOptions,
	): Promise<PTGetStepRunsPaginationResponse> => {
		const plainOptions = applyModelDecorators(PTGetStepRunOptions, options);
		const params = {
			...omitBy(plainOptions?.filters, isNil),
			...plainOptions?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<PTGetStepRunsPaginationResponse>(
			`projects/${projectId}/step_runs.json`,
			{
				params,
			},
		);

		return plainToInstance(PTGetStepRunsPaginationResponse, data);
	};
}
