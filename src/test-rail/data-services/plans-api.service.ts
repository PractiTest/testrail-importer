import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockTrGetPlansData } from 'src/test-rail/mockdata/mock-tr-get-plans-data';
import {
	TRGetPlansApiPaginationResponse,
	TRGetPlansOptions,
	TRPlanDto, TRPlansArrayEntry
} from 'src/test-rail/types/plan.dto';
import { TRGetCasesOptions } from '../types/case.dto';
import { TRApiService } from 'src/test-rail/http/tr-api.service';

// WON'T BE MIGRATED

export interface ITRPlansApiService {
	getPlansByProjectId(projectId: number, options?: TRGetPlansOptions): Promise<TRGetPlansApiPaginationResponse>;
	getPlanById(planId: number): Promise<TRPlanDto>;
}

@Injectable()
export class TRMockPlansApiService implements ITRPlansApiService {
	public getPlansByProjectId = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: TRGetPlansOptions,
	): Promise<TRGetPlansApiPaginationResponse> => {
		const data = await mockTrGetPlansData();

		return plainToInstance(TRGetPlansApiPaginationResponse, data);
	};

	public getPlanById = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: TRGetPlansOptions,
	): Promise<TRPlanDto> => {
		const data = await mockTrGetPlansData();

		return plainToInstance(TRPlanDto, data.plans[0]);
	};
}

@Injectable()
export class TRPlansApiService implements ITRPlansApiService {
	constructor(private readonly httpService: TRApiService) {}

	public getPlansByProjectId = async (
		projectId: number,
		options?: TRGetPlansOptions,
	): Promise<TRGetPlansApiPaginationResponse> => {
		const optionsInstance = plainToInstance(TRGetCasesOptions, options);
		const params = {
			...options?.pagination,
			...instanceToPlain(optionsInstance?.filters),
		};

		const { data } = await this.httpService.axiosRef.get<TRGetPlansApiPaginationResponse | TRPlansArrayEntry[]>(`get_plans/${projectId}`, {
			params,
		});

		if (Array.isArray(data)) {
			return plainToInstance(TRGetPlansApiPaginationResponse, { plans: data });
		}

		return plainToInstance(TRGetPlansApiPaginationResponse, data);
	};

	public getPlanById = async (planId: number): Promise<TRPlanDto> => {
		const { data } = await this.httpService.axiosRef.get<TRPlanDto>(`get_plan/${planId}`);

		return plainToInstance(TRPlanDto, data);
	};
}
