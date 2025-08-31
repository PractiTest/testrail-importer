import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';
import { PTGetProjectsPaginationResponse } from '../types/project.dto';

export const mockPTProjectsResponse: PTGetProjectsPaginationResponse = plainToInstance(
	PTGetProjectsPaginationResponse,
	{
		data: [
			{
				id: '22',
				type: 'projects',
				attributes: {
					name: 'Verticals22',
					'created-at': '2021-10-04T12:01:05Z',
					'automation-support': true,
					'enable-delete-issues': false,
					'time-management-support': true,
				},
			},
			{
				id: '23',
				type: 'projects',
				attributes: {
					name: 'Verticals23',
					'created-at': '2021-10-04T12:01:05Z',
					'automation-support': true,
					'enable-delete-issues': false,
					'time-management-support': true,
				},
			},
			{
				id: '24',
				type: 'projects',
				attributes: {
					name: 'Verticals24',
					'created-at': '2021-10-04T12:01:05Z',
					'automation-support': true,
					'enable-delete-issues': false,
					'time-management-support': true,
				},
			},
			{
				id: '25',
				type: 'projects',
				attributes: {
					name: 'Verticals25',
					'created-at': '2021-10-04T12:01:05Z',
					'automation-support': true,
					'enable-delete-issues': false,
					'time-management-support': true,
				},
			},
		],
		links: {},
		meta: {
			'current-page': 1,
			'next-page': null,
			'prev-page': null,
			'total-pages': 1,
			'total-count': 5,
		},
	},
);

export const mockPtGetAllProjectsData = mockApiFactory<PTGetProjectsPaginationResponse>(mockPTProjectsResponse);
