import { Expose, Type } from 'class-transformer';
import { TRBaseApiPaginationResponse } from 'src/test-rail/types/general-types';
export class TRSuiteDto {
	@Expose({ name: 'project_id' })
	public projectId: number; // The ID of the project the suite is assigned to

	public id: number;
	public description?: string; // The description of the suite
	public name: string; // The name of the suite
	public url: string; // The address/URL of the suite in the user interface
}

export class TRGetSuitesApiPaginationResponse extends TRBaseApiPaginationResponse {
	@Type(() => TRSuiteDto)
	public suites: TRSuiteDto[];
}
