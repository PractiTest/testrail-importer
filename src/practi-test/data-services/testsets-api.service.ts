import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockPtGetTestSetData, mockPtGetTestSetsData } from 'src/practi-test/mockdata/mock-pt-get-testsets-data';
import {
	PTGetTestSetResponse,
	PTGetTestSetsOptions,
	PTGetTestSetsPaginationResponse,
	PTNewTestSetData,
	PTUpdateTestSetData,
} from 'src/practi-test/types/testset.dto';
import { PTApiService } from 'src/practi-test/http/pt-api.service';
import { applyModelDecorators } from 'src/core/utils/model.utils';
import { PTUpdateTestData } from 'src/practi-test/types/test.dto';
import { isNil, omitBy } from 'lodash';

interface IPTTestSetsApiService {
	getTestSetsByProjectId(
		projectId: number | string,
		options?: PTGetTestSetsOptions,
	): Promise<PTGetTestSetsPaginationResponse>;
	createTestSet(projectId: number, testSetData: PTNewTestSetData): Promise<PTGetTestSetResponse>;
	updateTestSet(projectId: number, testSetId: number, testSetData: PTUpdateTestSetData): Promise<PTGetTestSetResponse>;
	deleteTestSet(projectId: number, testSetId: number): Promise<unknown>;
}

@Injectable()
export class PTMockTestSetsApiService implements IPTTestSetsApiService {
	public getTestSetsByProjectId = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number | string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: PTGetTestSetsOptions,
	): Promise<PTGetTestSetsPaginationResponse> => {
		const data = await mockPtGetTestSetsData();

		return plainToInstance(PTGetTestSetsPaginationResponse, data);
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public createTestSet = async (projectId: number, testSetData: PTNewTestSetData): Promise<PTGetTestSetResponse> => {
		const data = await mockPtGetTestSetData();

		return plainToInstance(PTGetTestSetResponse, data);
	};

	public updateTestSet = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		testSetId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		testSetData: PTUpdateTestData,
	): Promise<PTGetTestSetResponse> => {
		const data = await mockPtGetTestSetData();

		return plainToInstance(PTGetTestSetResponse, data);
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async deleteTestSet(projectId: number, testSetId: number): Promise<unknown> {
		return Promise.resolve();
	}
}

@Injectable()
export class PTTestSetsApiService implements IPTTestSetsApiService {
	constructor(private readonly httpService: PTApiService) {}

	public getTestSetsByProjectId = async (
		projectId: number | string,
		options?: PTGetTestSetsOptions,
	): Promise<PTGetTestSetsPaginationResponse> => {
		const plainOptions = applyModelDecorators(PTGetTestSetsOptions, options);
		const params = {
			...omitBy(plainOptions?.filters, isNil),
			...plainOptions?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<PTGetTestSetsPaginationResponse>(
			`projects/${projectId}/sets.json`,
			{
				params,
			},
		);

		return plainToInstance(PTGetTestSetsPaginationResponse, data);
	};

	public createTestSet = async (projectId: number, testSetData: PTNewTestSetData): Promise<PTGetTestSetResponse> => {
		const body = {
			data: applyModelDecorators(PTNewTestSetData, testSetData),
		};
		const { data } = await this.httpService.axiosRef.post<PTGetTestSetResponse>(
			`projects/${projectId}/sets.json`,
			body,
		);

		return plainToInstance(PTGetTestSetResponse, data);
	};

	public updateTestSet = async (
		projectId: number,
		testSetId: number,
		testSetData: PTUpdateTestSetData,
	): Promise<PTGetTestSetResponse> => {
		const body = {
			data: applyModelDecorators(PTUpdateTestSetData, testSetData),
		};
		const { data } = await this.httpService.axiosRef.put<PTGetTestSetResponse>(
			`projects/${projectId}/sets/${testSetId}.json`,
			body,
		);

		return plainToInstance(PTGetTestSetResponse, data);
	};

	public deleteTestSet = async (projectId: number, testSetId: number): Promise<unknown> => {
		const { data } = await this.httpService.axiosRef.delete<unknown>(`projects/${projectId}/sets/${testSetId}.json`);

		return data;
	};
}
