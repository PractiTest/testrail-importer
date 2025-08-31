import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockTrGetResultsData } from 'src/test-rail/mockdata/mock-tr-get-results-data';
import { TRGetResultsApiPaginationResponse, TRResultDto } from 'src/test-rail/types/result.dto';
import { ITRApiOptions } from '../types/general-types';
import { TRApiService } from 'src/test-rail/http/tr-api.service';
import { TRCustomFieldDto } from 'src/test-rail/types/custom-field.dto';

export enum TRResultStatusType {
	PASSED = 'PASSED',
	BLOCKED = 'BLOCKED',
	UNTESTED = 'NO RUN',
	RETEST = 'N/A',
	FAILED = 'FAILED',
}

export const resultStatusesMap = new Map<number, TRResultStatusType>([
	[1, TRResultStatusType.PASSED],
	[2, TRResultStatusType.BLOCKED],
	[3, TRResultStatusType.UNTESTED],
	[4, TRResultStatusType.RETEST],
	[5, TRResultStatusType.FAILED],
]);

export interface ITRResultsApiService {
	getResultsByTestId(testId: number, options?: ITRApiOptions): Promise<TRGetResultsApiPaginationResponse>;
}

@Injectable()
export class TRMockResultsApiService implements ITRResultsApiService {
	public getResultsByTestId = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		testId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: ITRApiOptions,
	): Promise<TRGetResultsApiPaginationResponse> => {
		const data = await mockTrGetResultsData();

		return plainToInstance(TRGetResultsApiPaginationResponse, data);
	};
}

@Injectable()
export class TRResultsApiService implements ITRResultsApiService {
	constructor(private readonly httpService: TRApiService) {}

	public getResultsByTestId = async (
		testId: number,
		options?: ITRApiOptions,
	): Promise<TRGetResultsApiPaginationResponse> => {
		const params = {
			...options?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<TRGetResultsApiPaginationResponse | TRResultDto[]>(`get_results/${testId}`, {
			params,
		});

		if (Array.isArray(data)) {
			return plainToInstance(TRGetResultsApiPaginationResponse, { results: data });
		}

		return plainToInstance(TRGetResultsApiPaginationResponse, data);
	};

	public getResultsByRunId = async (
		runId: number,
		options?: ITRApiOptions,
	): Promise<TRGetResultsApiPaginationResponse> => {
		const params = {
			...options?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<TRGetResultsApiPaginationResponse | TRResultDto[]>(
			`get_results_for_run/${runId}`,
			{
				params,
			},
		);

		if (Array.isArray(data)) {
			return plainToInstance(TRGetResultsApiPaginationResponse, { results: data });
		}

		return plainToInstance(TRGetResultsApiPaginationResponse, data);
	};

	public getResultCustomFields = async (projectId: number): Promise<TRCustomFieldDto[]> => {
		const { data } = await this.httpService.axiosRef.get<TRCustomFieldDto[]>(`get_result_fields`);

		return plainToInstance(TRCustomFieldDto, data).filter(
			(customField) =>
				!!customField.configs.find(
					(config) => config.context.isGlobal || config.context.projectIds.includes(projectId),
				),
		);
	};
}
