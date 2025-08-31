import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockTrGetSectionsData } from 'src/test-rail/mockdata/mock-tr-get-sections-data';
import { TRGetSectionsApiPaginationResponse, TRSectionDto } from 'src/test-rail/types/section.dto';
import { ITRApiOptions } from '../types/general-types';
import { TRApiService } from 'src/test-rail/http/tr-api.service';

// WON'T BE MIGRATED

export interface ITRSectionsApiService {
	getSectionsByProjectIdAndSuiteId(
		projectId: number,
		suiteId?: number,
		options?: ITRApiOptions,
	): Promise<TRGetSectionsApiPaginationResponse>;
}

@Injectable()
export class TRMockSectionsApiService implements ITRSectionsApiService {
	public getSectionsByProjectIdAndSuiteId = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		suiteId?: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: ITRApiOptions,
	): Promise<TRGetSectionsApiPaginationResponse> => {
		const data = await mockTrGetSectionsData();

		return plainToInstance(TRGetSectionsApiPaginationResponse, data);
	};
}

@Injectable()
export class TRSectionsApiService implements ITRSectionsApiService {
	constructor(private readonly httpService: TRApiService) {}

	public getSectionsByProjectIdAndSuiteId = async (
		projectId: number,
		suiteId?: number | null,
		options?: ITRApiOptions,
	): Promise<TRGetSectionsApiPaginationResponse> => {
		const params = {
			...options?.pagination,
			...(suiteId ? { suite_id: suiteId } : {}),
		};
		const { data } = await this.httpService.axiosRef.get<TRGetSectionsApiPaginationResponse | TRSectionDto[]>(
			`get_sections/${projectId}`,
			{
				params,
			},
		);

		if (Array.isArray(data)) {
			return plainToInstance(TRGetSectionsApiPaginationResponse, { sections: data });
		}

		return plainToInstance(TRGetSectionsApiPaginationResponse, data);
	};
}
