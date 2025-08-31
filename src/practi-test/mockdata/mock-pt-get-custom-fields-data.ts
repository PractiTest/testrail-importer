import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';
import { PTGetCustomFieldResponse, PTGetCustomFieldsPaginationResponse } from '../types/custom-field.dto';

export const mockPTGetCustomFieldsResponse: PTGetCustomFieldsPaginationResponse = plainToInstance(
	PTGetCustomFieldsPaginationResponse,
	{
		data: [
			{
				id: '45916',
				type: 'custom-fields',
				attributes: {
					name: 'che',
					'field-format': 'multilist',
					'project-id': 4566,
					'possible-values': ['dog', 'cat'],
					'parent-list-id': null,
					'possible-values-parent-cf-id': 45911,
					'created-at': '2016-12-19T14:00:45+02:00',
					'updated-at': '2016-12-19T14:00:45+02:00',
				},
			},
			{
				id: '459187',
				type: 'custom-fields',
				attributes: {
					name: 'Multilist (Dec 19th)',
					'field-format': 'multilist',
					'project-id': 4566,
					'possible-values': ['one', 'two', 'three'],
					'parent-list-id': null,
					'possible-values-parent-cf-id': null,
					'created-at': '2016-12-19T12:41:51+02:00',
					'updated-at': '2016-12-19T12:41:51+02:00',
				},
			},
		],
		links: {
			self: 'https://api.practitest.com/api/v2/projects/4566/custom_fields.json?api_token=a519a5d2ea4fad48e24ae929b03c753c68fb799c&developer_email=christine%40pt.com&page%5Bnumber%5D=1&page%5Bsize%5D=2',
			next: 'https://api.practitest.com/api/v2/projects/4566/custom_fields.json?api_token=a519a5d2ea4fad48e24ae929b03c753c68fb799c&developer_email=christine%40pt.com&page%5Bnumber%5D=2&page%5Bsize%5D=2',
			last: 'https://api.practitest.com/api/v2/projects/4566/custom_fields.json?api_token=a519a5d2ea4fad48e24ae929b03c753c68fb799c&developer_email=christine%40pt.com&page%5Bnumber%5D=19&page%5Bsize%5D=2',
		},
		meta: {
			'current-page': 1,
			'next-page': 2,
			'prev-page': null,
			'total-pages': 19,
			'total-count': 37,
		},
	},
);

export const mockPTGetCustomFieldResponse: PTGetCustomFieldResponse = plainToInstance(PTGetCustomFieldResponse, {
	data: {
		id: '45893',
		type: 'custom-fields',
		attributes: {
			name: 'Test API2',
			'field-format': 'list',
			'project-id': 4566,
			'possible-values': ['one', 'five'],
			'parent-list-id': null,
			'possible-values-parent-cf-id': null,
			'created-at': '2016-12-08T18:26:54+02:00',
			'updated-at': '2016-12-19T16:53:28+02:00',
		},
	},
});

export const mockPtGetCustomFieldsData =
	mockApiFactory<PTGetCustomFieldsPaginationResponse>(mockPTGetCustomFieldsResponse);
export const mockPtGetCustomFieldData = mockApiFactory<PTGetCustomFieldResponse>(mockPTGetCustomFieldResponse);
