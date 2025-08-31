import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { TRApiService } from 'src/test-rail/http/tr-api.service';
import {
	TRGetSharedStepsApiPaginationResponse,
	TRGetSharedStepsOptions,
	TRSharedStepDto
} from 'src/test-rail/types/shared-step.dto';

export interface ITRSharedStepsApiService {
	getSharedStepsByProjectId(
		projectId: number,
		options?: TRGetSharedStepsOptions,
	): Promise<TRGetSharedStepsApiPaginationResponse>;
}

@Injectable()
export class TRSharedStepsApiService implements ITRSharedStepsApiService {
	constructor(private readonly httpService: TRApiService) {}

	public getSharedStepsByProjectId = async (
		projectId: number,
		options?: TRGetSharedStepsOptions,
	): Promise<TRGetSharedStepsApiPaginationResponse> => {
		const optionsInstance = plainToInstance(TRGetSharedStepsOptions, options);
		const params = {
			...options?.pagination,
			...instanceToPlain(optionsInstance?.filters),
		};

		const { data } = await this.httpService.axiosRef.get<TRGetSharedStepsApiPaginationResponse | TRSharedStepDto[]>(
			`get_shared_steps/${projectId}`,
			{
				params,
			},
		);

		if (Array.isArray(data)) {
			return plainToInstance(TRGetSharedStepsApiPaginationResponse, { sharedSteps: data });
		}

		return plainToInstance(TRGetSharedStepsApiPaginationResponse, data);
	};
}
