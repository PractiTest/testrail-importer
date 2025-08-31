import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';
import { PTGetRunResponse, PTGetRunsPaginationResponse } from '../types/run.dto';

export const mockPTGetRunsResponse: PTGetRunsPaginationResponse = plainToInstance(PTGetRunsPaginationResponse, {
	data: [
		{
			id: '49676',
			type: 'runs',
			attributes: {
				'project-id': 4566,
				status: 'NO RUN',
				'tester-id': 5380,
				'instance-id': 98016,
				preconditions: null,
				version: '2',
				'test-id': 80893,
				'run-type': 'ManualRun',
				'custom-fields': {
					'---f-47889': 'Mac',
				},
				'automated-execution-output': null,
				'run-duration': '00:53:20',
				'created-at': '2017-03-07T11:10:42+02:00',
				'updated-at': '2017-03-07T12:04:44+02:00',
			},
		},
		{
			id: '49663',
			type: 'runs',
			attributes: {
				'project-id': 4566,
				status: 'NOT COMPLETED',
				'tester-id': 5380,
				'instance-id': 98016,
				preconditions: null,
				version: '1.5',
				'test-id': 80893,
				'run-type': 'ManualRun',
				'custom-fields': {},
				'automated-execution-output': null,
				'run-duration': '00:00:00',
				'created-at': '2017-02-21T13:25:34+02:00',
				'updated-at': '2017-02-21T13:25:34+02:00',
			},
		},
	],
	links: {
		self: 'https://api.practitest.com/api/v2/projects/4566/runs.json?api_token=xx&developer_email=pt%40gmail.com&page%5Bnumber%5D=1&page%5Bsize%5D=2',
		next: 'https://api.practitest.com/api/v2/projects/4566/runs.json?api_token=xx&developer_email=pt%40gmail.com&page%5Bnumber%5D=2&page%5Bsize%5D=2',
		last: 'https://api.practitest.com/api/v2/projects/4566/runs.json?api_token=xx&developer_email=pt%40gmail.com&page%5Bnumber%5D=41&page%5Bsize%5D=2',
	},
	meta: {
		'current-page': 1,
		'next-page': 2,
		'prev-page': null,
		'total-pages': 41,
		'total-count': 81,
	},
});

export const mockPTGetRunResponse: PTGetRunResponse = plainToInstance(PTGetRunResponse, {
	data: {
		id: '49676',
		type: 'runs',
		attributes: {
			'project-id': 4566,
			status: 'NO RUN',
			'tester-id': 5380,
			'instance-id': 98016,
			preconditions: null,
			version: '2',
			'test-id': 80893,
			'run-type': 'ManualRun',
			'custom-fields': {
				'---f-47889': 'Mac',
			},
			'automated-execution-output': null,
			'run-duration': '00:53:20',
			'created-at': '2017-03-07T11:10:42+02:00',
			'updated-at': '2017-03-07T12:04:44+02:00',
		},
	},
});

export const mockPtGetRunsData = mockApiFactory<PTGetRunsPaginationResponse>(mockPTGetRunsResponse);
export const mockPtGetRunData = mockApiFactory<PTGetRunResponse>(mockPTGetRunResponse);
