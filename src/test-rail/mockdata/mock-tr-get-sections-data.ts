import { TRGetSectionsApiPaginationResponse } from 'src/test-rail/types/section.dto';
import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';

// WON'T BE MIGRATED
export const mockTRSectionsResponse: TRGetSectionsApiPaginationResponse = plainToInstance(
	TRGetSectionsApiPaginationResponse,
	{
		offset: 0,
		limit: 250,
		size: 23,
		_links: {
			next: null,
			prev: null,
		},
		sections: [
			{
				depth: 0,
				display_order: 1,
				id: 1,
				name: 'Prerequisites',
				parent_id: null,
				suite_id: 1,
			},
			{
				depth: 0,
				display_order: 2,
				id: 2,
				name: 'Documentation & Help',
				parent_id: null,
				suite_id: 1,
			},
			{
				depth: 1, // A child section
				display_order: 3,
				id: 3,
				name: 'Licensing & Terms',
				parent_id: 2, // Points to the parent section
				suite_id: 1,
			},
		],
	},
);

export const mockTrGetSectionsData = mockApiFactory<TRGetSectionsApiPaginationResponse>(mockTRSectionsResponse);
