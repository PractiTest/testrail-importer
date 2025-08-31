import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { TRApiService } from 'src/test-rail/http/tr-api.service';
import { TRGetSuitesApiPaginationResponse, TRSuiteDto } from 'src/test-rail/types/suites.dto';
import { mockTrGetSuitesData } from 'src/test-rail/mockdata/mock-tr-get-suites-data';
import { ITRApiOptions } from 'src/test-rail/types/general-types';

export interface ITRSuitesApiService {
	getSuitesByProjectId(projectId: number): Promise<TRGetSuitesApiPaginationResponse>;
}

@Injectable()
export class TRMockSuitesApiService implements ITRSuitesApiService {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getSuitesByProjectId = async (projectId: number): Promise<TRGetSuitesApiPaginationResponse> => {
		const data = await mockTrGetSuitesData();

		return plainToInstance(TRGetSuitesApiPaginationResponse, data);
	};
}

@Injectable()
export class TRSuitesApiService implements ITRSuitesApiService {
	constructor(private readonly httpService: TRApiService) {
	}

	public getSuitesByProjectId = async (projectId: number, options?: ITRApiOptions): Promise<TRGetSuitesApiPaginationResponse> => {
		const params = {
			...options?.pagination
		};

		const { data } = await this.httpService.axiosRef.get<TRGetSuitesApiPaginationResponse | TRSuiteDto[]>(`get_suites/${projectId}`, {
			params
		});

		if (Array.isArray(data)) {
			return plainToInstance(TRGetSuitesApiPaginationResponse, { suites: data });
		}

		return plainToInstance(TRGetSuitesApiPaginationResponse, data);
	};
}
