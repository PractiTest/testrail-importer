import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockTrGetCasesData } from 'src/test-rail/mockdata/mock-tr-get-cases-data';
import { TRCaseDto, TRGetCasesApiPaginationResponse, TRGetCasesOptions } from 'src/test-rail/types/case.dto';
import { TRApiService } from 'src/test-rail/http/tr-api.service';
import { TRCustomFieldDto } from 'src/test-rail/types/custom-field.dto';

export interface ITRCasesApiService {
	getCasesByProjectIdAndSuiteId(
		projectId: number,
		suiteId?: number,
		options?: TRGetCasesOptions,
	): Promise<TRGetCasesApiPaginationResponse>;
}

@Injectable()
export class TRMockCasesApiService implements ITRCasesApiService {
	public getCasesByProjectIdAndSuiteId = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		suiteId?: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: TRGetCasesOptions,
	): Promise<TRGetCasesApiPaginationResponse> => {
		const data = await mockTrGetCasesData();

		return plainToInstance(TRGetCasesApiPaginationResponse, data);
	};
}

@Injectable()
export class TRCasesApiService implements ITRCasesApiService {
	constructor(private readonly httpService: TRApiService) {}

	public getCasesByProjectIdAndSuiteId = async (
		projectId: number,
		suiteId?: number | null,
		options?: TRGetCasesOptions,
	): Promise<TRGetCasesApiPaginationResponse> => {
		const optionsInstance = plainToInstance(TRGetCasesOptions, options);
		const params = {
			...options?.pagination,
			...(suiteId ? { suite_id: suiteId } : {}),
			...instanceToPlain(optionsInstance?.filters),
		};

		const { data } = await this.httpService.axiosRef.get<TRGetCasesApiPaginationResponse | TRCaseDto[]>(`get_cases/${projectId}`, {
			params,
		});

		if (Array.isArray(data)) {
			return plainToInstance(TRGetCasesApiPaginationResponse, { cases: data });
		}

		return plainToInstance(TRGetCasesApiPaginationResponse, data);
	};

	public getCaseCustomFields = async (projectId: number): Promise<TRCustomFieldDto[]> => {
		const { data } = await this.httpService.axiosRef.get<TRCustomFieldDto[]>(`get_case_fields`);

		return plainToInstance(TRCustomFieldDto, data).filter(
			(customField) =>
				!!customField.configs.find(
					(config) => config.context.isGlobal || config.context.projectIds.includes(projectId),
				),
		);
	};
}
