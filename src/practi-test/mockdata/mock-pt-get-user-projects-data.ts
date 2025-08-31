import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';
import { PTGetUserProjectsPaginationResponse } from '../types/user-project.dto';

export const mockPTGetUserProjectsResponse: PTGetUserProjectsPaginationResponse = plainToInstance(
	PTGetUserProjectsPaginationResponse,
	{
		data: [
			{
				id: '2',
				type: 'projects',
				attributes: {
					name: 'jira cloud',
					'created-at': '2019-04-18T14:03:38Z',
					'automation-support': false,
					'enable-delete-issues': false,
					'time-management-support': true,
					groups: [
						{
							id: 5,
							name: 'Administrators',
						},
					],
				},
			},
		],
		links: {
			self: 'http://localhost:3000/api/v2/users/2/projects.json?page%5Bnumber%5D=1&page%5Bsize%5D=100',
			first: 'http://localhost:3000/api/v2/users/2/projects.json?page%5Bnumber%5D=1&page%5Bsize%5D=100',
			prev: null,
			next: null,
			last: 'http://localhost:3000/api/v2/users/2/projects.json?page%5Bnumber%5D=1&page%5Bsize%5D=100',
		},
		meta: {
			'current-page': 1,
			'next-page': null,
			'prev-page': null,
			'total-pages': 1,
			'total-count': 1,
		},
	},
);

export const mockPtGetUserProjectsData =
	mockApiFactory<PTGetUserProjectsPaginationResponse>(mockPTGetUserProjectsResponse);
