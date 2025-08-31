import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockTrGetTemplatesData } from 'src/test-rail/mockdata/mock-tr-get-templates-data';
import { TRTemplateDto } from 'src/test-rail/types/template.dto';
import { TRApiService } from 'src/test-rail/http/tr-api.service';

// CUSTOM TEMPLATES WON'T BE MIGRATED

export interface ITRTemplatesApiService {
	getTemplatesByProjectId(projectId: number): Promise<TRTemplateDto[]>;
}
@Injectable()
export class TRMockTemplatesApiService implements ITRTemplatesApiService {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getTemplatesByProjectId = async (projectId: number): Promise<TRTemplateDto[]> => {
		const data = await mockTrGetTemplatesData();

		return plainToInstance(TRTemplateDto, data);
	};
}

@Injectable()
export class TRTemplatesApiService implements ITRTemplatesApiService {
	constructor(private readonly httpService: TRApiService) {}

	public getTemplatesByProjectId = async (projectId: number): Promise<TRTemplateDto[]> => {
		const { data } = await this.httpService.axiosRef.get<TRTemplateDto[]>(`get_templates/${projectId}`);

		return plainToInstance(TRTemplateDto, data);
	};
}
