import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockTrGetTestsData } from 'src/test-rail/mockdata/mock-tr-get-tests-data';
import { TRGetTestsApiPaginationResponse, TRTestDto } from 'src/test-rail/types/test.dto';
import { ITRApiOptions } from '../types/general-types';
import { TRApiService } from 'src/test-rail/http/tr-api.service';

export interface ITRTestsApiService {
	getTestsByRunId(runId: number, options?: ITRApiOptions): Promise<TRGetTestsApiPaginationResponse>;
}

@Injectable()
export class TRMockTestsApiService implements ITRTestsApiService {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getTestsByRunId = async (runId: number, options?: ITRApiOptions): Promise<TRGetTestsApiPaginationResponse> => {
		const data = await mockTrGetTestsData();

		return plainToInstance(TRGetTestsApiPaginationResponse, data);
	};
}

@Injectable()
export class TRTestsApiService implements ITRTestsApiService {
	constructor(private readonly httpService: TRApiService) {}

	public getTestsByRunId = async (runId: number, options?: ITRApiOptions): Promise<TRGetTestsApiPaginationResponse> => {
		const params = {
			...options?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<TRGetTestsApiPaginationResponse | TRTestDto[]>(`get_tests/${runId}`, {
			params,
		});

		if (Array.isArray(data)) {
			return plainToInstance(TRGetTestsApiPaginationResponse, { tests: data });
		}

		return plainToInstance(TRGetTestsApiPaginationResponse, data);
	};
}
