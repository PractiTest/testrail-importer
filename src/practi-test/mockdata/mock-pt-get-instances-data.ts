import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';
import { PTGetInstanceResponse, PTGetInstancesPaginationResponse } from '../types/instance.dto';

export const mockPTGetInstancesResponse: PTGetInstancesPaginationResponse = plainToInstance(
	PTGetInstancesPaginationResponse,
	{
		data: [
			{
				id: '1850360',
				type: 'instances',
				attributes: {
					name: 'User login',
					'project-id': 1282,
					'set-id': 96530,
					'set-display-id': 117,
					'test-id': 369093,
					'test-display-id': 2372,
					'custom-fields': {
						'---f-2640': 'my text one',
						'---f-2641': ['foo0'],
					},
					'display-id': '117:19',
					'tester-id': 4825,
					priority: null,
					'last-run-duration': '00:00:00',
					'last-run': '2015-11-18T07:46:57+00:00',
					'run-status': 'PASSED',
					'planned-execution': null,
					version: null,
					'assigned-to-id': null,
					'assigned-to-type': null,
					'created-at': '2015-11-17T09:29:22+00:00',
					'updated-at': '2015-11-17T09:29:22+00:00',
				},
			},
			{
				id: '1850361',
				type: 'instances',
				attributes: {
					name: 'User delete',
					'project-id': 1282,
					'set-id': 96530,
					'set-display-id': 117,
					'test-id': 369094,
					'test-display-id': 2373,
					'custom-fields': {},
					'display-id': '117:20',
					'tester-id': 4825,
					priority: null,
					'last-run-duration': '00:00:00',
					'last-run': '2015-11-19T04:42:30+00:00',
					'run-status': 'PASSED',
					'planned-execution': null,
					version: null,
					'assigned-to-id': null,
					'assigned-to-type': null,
					'created-at': '2015-11-17T09:29:22+00:00',
					'updated-at': '2015-11-17T09:29:22+00:00',
				},
			},
		],
		links: {
			self: 'https://api.practitest.com/api/v2/projects/1282/instances.json?api_token=b28a2be5e18491c7779e224ac60c4f815407d923&developer_email=dkd%40dkd.com&name_like=Issuer3&page%5Bnumber%5D=1&page%5Bsize%5D=6&set_filter_id=70859&set_ids=96530',
			next: 'https://api.practitest.com/api/v2/projects/1282/instances.json?api_token=b28a2be5e18491c7779e224ac60c4f815407d923&developer_email=dkd%40dkd.com&name_like=Issuer3&page%5Bnumber%5D=2&page%5Bsize%5D=6&set_filter_id=70859&set_ids=96530',
			last: 'https://api.practitest.com/api/v2/projects/1282/instances.json?api_token=b28a2be5e18491c7779e224ac60c4f815407d923&developer_email=dkd%40dkd.com&name_like=Issuer3&page%5Bnumber%5D=3&page%5Bsize%5D=6&set_filter_id=70859&set_ids=96530',
		},
		meta: {
			'current-page': 1,
			'next-page': 2,
			'prev-page': null,
			'total-pages': 5,
			'total-count': 13,
		},
	},
);

export const mockPTGetInstanceResponse: PTGetInstanceResponse = plainToInstance(PTGetInstanceResponse, {
	data: {
		id: '1850360',
		type: 'instances',
		attributes: {
			name: 'User login',
			'project-id': 1282,
			'set-id': 96530,
			'set-display-id': 117,
			'test-id': 369093,
			'test-display-id': 2372,
			'custom-fields': {
				'---f-2640': 'my text one',
				'---f-2641': ['foo0'],
			},
			'display-id': '117:19',
			'tester-id': 4825,
			priority: null,
			'last-run-duration': '00:00:00',
			'last-run': '2015-11-18T07:46:57+00:00',
			'run-status': 'PASSED',
			'planned-execution': null,
			version: null,
			'assigned-to-id': null,
			'assigned-to-type': null,
			'created-at': '2015-11-17T09:29:22+00:00',
			'updated-at': '2015-11-17T09:29:22+00:00',
		},
	},
});

export const mockPtGetInstancesData = mockApiFactory<PTGetInstancesPaginationResponse>(mockPTGetInstancesResponse);

export const mockPtGetInstanceData = mockApiFactory<PTGetInstanceResponse>(mockPTGetInstanceResponse);
