import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockTrGetRunsData } from 'src/test-rail/mockdata/mock-tr-get-runs-data';
import { TRGetRunsApiPaginationResponse, TRRunDto } from 'src/test-rail/types/run.dto';
import { ITRApiOptions } from '../types/general-types';
import { TRApiService } from 'src/test-rail/http/tr-api.service';

export interface ITRRunsApiService {
	getRunsByProjectId(projectId: number, options?: ITRApiOptions): Promise<TRGetRunsApiPaginationResponse>;
}

@Injectable()
export class TRMockRunsApiService implements ITRRunsApiService {
	public getRunsByProjectId = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: ITRApiOptions,
	): Promise<TRGetRunsApiPaginationResponse> => {
		const data = await mockTrGetRunsData();

		return plainToInstance(TRGetRunsApiPaginationResponse, data);
	};
}

@Injectable()
export class TRRunsApiService implements ITRRunsApiService {
	constructor(private readonly httpService: TRApiService) {}

	public getRunsByProjectId = async (
		projectId: number,
		options?: ITRApiOptions,
	): Promise<TRGetRunsApiPaginationResponse> => {
		const params = {
			...options?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<TRGetRunsApiPaginationResponse | TRRunDto[]>(`get_runs/${projectId}`, {
			params,
		});

		if (Array.isArray(data)) {
			return plainToInstance(TRGetRunsApiPaginationResponse, { runs: data });
		}

		return plainToInstance(TRGetRunsApiPaginationResponse, data);
	};
}
