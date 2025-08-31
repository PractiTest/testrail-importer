import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';
import { PTGetProjectResponse } from '../types/project.dto';

export const mockPTProjectResponse: PTGetProjectResponse = plainToInstance(PTGetProjectResponse, {
	data: {
		id: '22',
		type: 'projects',
		attributes: {
			name: 'Verticals',
			'created-at': '2021-10-04T12:01:05Z',
			'automation-support': true,
			'enable-delete-issues': false,
			'time-management-support': true,
		},
	},
});

export const mockPtGetSpecificProjectData = mockApiFactory<PTGetProjectResponse>(mockPTProjectResponse);
