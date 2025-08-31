import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';
import { PTGetTestResponse, PTGetTestsPaginationResponse } from '../types/test.dto';

export const mockPTGetTestsResponse: PTGetTestsPaginationResponse = plainToInstance(PTGetTestsPaginationResponse, {
	data: [
		{
			id: '1850360',
			type: 'tests',
			attributes: {
				'project-id': 1230,
				'display-id': 205,
				name: 'first name',
				description: 'My description',
				'steps-count': 0,
				status: 'Ready',
				'run-status': 'FAILED',
				'last-run': '2017-01-27T13:35:25+00:00',
				'author-id': 3596,
				'assigned-to-id': null,
				'assigned-to-type': null,
				'cloned-from-id': null,
				'planned-execution': null,
				version: null,
				priority: null,
				'duration-estimate': '00:00:00',
				'test-type': 'ScriptedTest',
				'custom-fields': {
					'---f-8282': 'High',
				},
				'folder-id': null,
				'created-at': '2017-01-27T12:19:46+00:00',
				'updated-at': '2017-01-27T12:24:07+00:00',
			},
		},
	],
	links: {
		self: 'https://api.practitest.com/api/v2/projects/1282/tests.json?api_token=YOUR_TOKEN&developer_email=your_EMAIL&name_like=Issuer3&page%5Bnumber%5D=1&page%5Bsize%5D=6&set_filter_id=70859&set_ids=96530',
		next: 'https://api.practitest.com/api/v2/projects/1282/tests.json?api_token=YOUR_TOKEN&developer_email=your_EMAIL&name_like=Issuer3&page%5Bnumber%5D=2&page%5Bsize%5D=6&set_filter_id=70859&set_ids=96530',
		last: 'https://api.practitest.com/api/v2/projects/1282/tests.json?api_token=YOUR_TOKEN&developer_email=your_EMAIL&name_like=Issuer3&page%5Bnumber%5D=3&page%5Bsize%5D=6&set_filter_id=70859&set_ids=96530',
	},
	meta: {
		'current-page': 1,
		'next-page': 2,
		'prev-page': null,
		'total-pages': 5,
		'total-count': 13,
	},
});

export const mockPTGetTestResponse: PTGetTestResponse = plainToInstance(PTGetTestResponse, {
	data: {
		id: '1850360',
		type: 'tests',
		attributes: {
			'project-id': 1230,
			'display-id': 205,
			name: 'first name',
			description: 'My description',
			'steps-count': 0,
			status: 'Ready',
			'run-status': 'FAILED',
			'last-run': '2017-01-27T13:35:25+00:00',
			'author-id': 3596,
			'assigned-to-id': null,
			'assigned-to-type': null,
			'cloned-from-id': null,
			'planned-execution': null,
			version: null,
			priority: null,
			'duration-estimate': '00:00:00',
			'test-type': 'ScriptedTest',
			'custom-fields': {
				'---f-8282': 'High',
			},
			'folder-id': null,
			'created-at': '2017-01-27T12:19:46+00:00',
			'updated-at': '2017-01-27T12:24:07+00:00',
		},
	},
});

export const mockPtGetTestsData = mockApiFactory<PTGetTestsPaginationResponse>(mockPTGetTestsResponse);

export const mockPtGetTestData = mockApiFactory<PTGetTestResponse>(mockPTGetTestResponse);
