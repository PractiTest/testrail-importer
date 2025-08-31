import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockPtGetTestData, mockPtGetTestsData } from 'src/practi-test/mockdata/mock-pt-get-tests-data';
import {
	PTGetTestResponse,
	PTGetTestsOptions,
	PTGetTestsPaginationResponse,
	PTNewTestData,
	PTUpdateTestData,
} from 'src/practi-test/types/test.dto';
import { PTApiService } from 'src/practi-test/http/pt-api.service';
import { applyModelDecorators } from 'src/core/utils/model.utils';
import { isNil, omitBy } from 'lodash';

interface IPTTestsApiService {
	getTestsByProjectId(projectId: number, options?: PTGetTestsOptions): Promise<PTGetTestsPaginationResponse>;
	createTest(projectId: number, testData: PTNewTestData): Promise<PTGetTestResponse>;
	updateTest(projectId: number, testId: number, testData: PTUpdateTestData): Promise<PTGetTestResponse>;
	deleteTest(projectId: number, testId: number): Promise<unknown>;
}

@Injectable()
export class PTMockTestsApiService implements IPTTestsApiService {
	public async getTestsByProjectId(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: PTGetTestsOptions,
	): Promise<PTGetTestsPaginationResponse> {
		const response = await mockPtGetTestsData();

		return plainToInstance(PTGetTestsPaginationResponse, response);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public createTest = async (projectId: number, testDate: PTNewTestData): Promise<PTGetTestResponse> => {
		const data = await mockPtGetTestData();

		return plainToInstance(PTGetTestResponse, data);
	};

	public updateTest = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		testId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		testData: PTNewTestData,
	): Promise<PTGetTestResponse> => {
		const data = await mockPtGetTestData();

		return plainToInstance(PTGetTestResponse, data);
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public deleteTest = async (projectId: number, testId: number): Promise<any> => Promise.resolve();
}

@Injectable()
export class PTTestsApiService implements IPTTestsApiService {
	constructor(private readonly httpService: PTApiService) {}

	public getTestsByProjectId = async (
		projectId: number,
		options?: PTGetTestsOptions,
	): Promise<PTGetTestsPaginationResponse> => {
		const plainOptions = applyModelDecorators(PTGetTestsOptions, options);
		const params = {
			...omitBy(plainOptions?.filters, isNil),
			...plainOptions?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<PTGetTestsPaginationResponse>(
			`projects/${projectId}/tests.json`,
			{
				params,
			},
		);

		return plainToInstance(PTGetTestsPaginationResponse, data);
	};

	public createTest = async (projectId: number, testData: PTNewTestData): Promise<PTGetTestResponse> => {
		const body = {
			data: applyModelDecorators(PTNewTestData, testData),
		};
		const { data } = await this.httpService.axiosRef.post<PTGetTestResponse>(`projects/${projectId}/tests.json`, body);

		return plainToInstance(PTGetTestResponse, data);
	};

	public updateTest = async (
		projectId: number,
		testId: number,
		testData: PTUpdateTestData,
	): Promise<PTGetTestResponse> => {
		const body = {
			data: applyModelDecorators(PTUpdateTestData, testData),
		};
		const { data } = await this.httpService.axiosRef.put<PTGetTestResponse>(
			`projects/${projectId}/tests/${testId}.json`,
			body,
		);

		return plainToInstance(PTGetTestResponse, data);
	};

	public deleteTest = async (projectId: number, testId: number): Promise<any> => {
		const { data } = await this.httpService.axiosRef.delete<unknown>(`projects/${projectId}/tests/${testId}.json`);

		return data;
	};
}
