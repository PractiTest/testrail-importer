import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';
import { PTGetUserResponse, PTUsersPaginationResponse } from '../types/user.dto';

export const mockPTGetUsersResponse: PTUsersPaginationResponse = plainToInstance(PTUsersPaginationResponse, {
	data: [
		{
			id: '53811',
			type: 'users',
			attributes: {
				'first-name': null,
				'last-name': null,
				'display-name': 'chris.z@rd.com',
				email: 'chris.z@rd.com',
				'time-zone': 'UTC',
				'created-at': '2016-05-30T16:45:02+03:00',
			},
		},
		{
			id: '538724',
			type: 'users',
			attributes: {
				'first-name': null,
				'last-name': null,
				'display-name': 'monica@gmail.com',
				email: 'monica@gmail.com',
				'time-zone': 'UTC',
				'created-at': '2016-06-20T14:35:19+03:00',
			},
		},
		{
			id: '539467',
			type: 'users',
			attributes: {
				'first-name': null,
				'last-name': null,
				'display-name': 'pascal@most.com',
				email: 'pascal@most.com',
				'time-zone': 'UTC',
				'created-at': '2016-07-07T17:44:15+03:00',
			},
		},
		{
			id: '539598',
			type: 'users',
			attributes: {
				'first-name': null,
				'last-name': null,
				'display-name': 'phillip.rik@pt.com',
				email: 'phillip.rik@pt.com',
				'time-zone': 'UTC',
				'created-at': '2016-07-27T15:08:14+03:00',
			},
		},
		{
			id: '539976',
			type: 'users',
			attributes: {
				'first-name': null,
				'last-name': null,
				'display-name': 'beck735306@pt.com',
				email: 'beck735306@pt.com',
				'time-zone': 'UTC',
				'created-at': '2016-08-08T15:05:13+03:00',
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
});

export const mockPTGetUserResponse: PTGetUserResponse = plainToInstance(PTGetUserResponse, {
	data: {
		id: '53811',
		type: 'users',
		attributes: {
			'first-name': null,
			'last-name': null,
			'display-name': 'chris.z@rd.com',
			email: 'chris.z@rd.com',
			'time-zone': 'UTC',
			'created-at': '2016-05-30T16:45:02+03:00',
		},
	},
});

export const mockPtGetUsersData = mockApiFactory<PTUsersPaginationResponse>(mockPTGetUsersResponse);
export const mockPtGetUserData = mockApiFactory<PTGetUserResponse>(mockPTGetUserResponse);
