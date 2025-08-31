import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';
import { TRGetSuitesApiPaginationResponse } from 'src/test-rail/types/suites.dto';

export const mockTRSuitesResponse: TRGetSuitesApiPaginationResponse = plainToInstance(TRGetSuitesApiPaginationResponse, {
	offset: 0,
	limit: 250,
	size: 2,
	_links: {
		next: null,
		prev: null
	},
	suites: [
		{
			description: '..',
			id: 1,
			name: 'Setup & Installation',
			project_id: 1,
			url: 'http:///testrail/index.php?/suites/view/1'
		},
		{
			description: '..',
			id: 2,
			name: 'Suite 2',
			project_id: 1,
			url: 'http:///testrail/index.php?/suites/view/2'
		}
	]
});

export const mockTrGetSuitesData = mockApiFactory<TRGetSuitesApiPaginationResponse>(mockTRSuitesResponse);
