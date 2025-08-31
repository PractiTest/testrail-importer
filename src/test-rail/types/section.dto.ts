import { Expose, Type } from 'class-transformer';
import { TRBaseApiPaginationResponse } from 'src/test-rail/types/general-types';

// WON'T BE MIGRATED
export class TRSectionDto {
	@Expose({ name: 'display_order' })
	public displayOrder: number;

	@Expose({ name: 'parent_id' })
	public parentId?: number;

	@Expose({ name: 'suite_id' })
	public suiteId: number;

	public id: number;
	public name: string;
	public depth: number;
	public description?: string;
}

export class TRGetSectionsApiPaginationResponse extends TRBaseApiPaginationResponse {
	@Type(() => TRSectionDto)
	public sections: TRSectionDto[];
}
