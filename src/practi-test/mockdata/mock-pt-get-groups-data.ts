import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';
import { PTGetGroupsPaginationResponse } from '../types/group.dto';

export const mockPTGroupResponse: PTGetGroupsPaginationResponse = plainToInstance(PTGetGroupsPaginationResponse, {
	data: [
		{
			id: '353',
			type: 'groups',
			attributes: {
				name: 'Administrators',
				'created-at': '2020-12-09T17:00:24+02:00',
			},
		},
		{
			id: '355',
			type: 'groups',
			attributes: {
				name: 'Developers',
				'created-at': '2020-12-09T17:00:24+02:00',
			},
		},
		{
			id: '354',
			type: 'groups',
			attributes: {
				name: 'Testers',
				'created-at': '2020-12-09T17:00:24+02:00',
			},
		},
	],
	links: {},
	meta: {
		'current-page': 1,
		'next-page': null,
		'prev-page': null,
		'total-pages': 1,
		'total-count': 3,
	},
});

export const mockPtGetGroupsData = mockApiFactory<PTGetGroupsPaginationResponse>(mockPTGroupResponse);
