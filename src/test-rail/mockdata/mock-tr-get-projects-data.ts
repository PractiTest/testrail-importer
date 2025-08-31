import { TRGetProjectsApiPaginationResponse } from 'src/test-rail/types/project.dto';
import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';

export const mockTRProjectsResponse: TRGetProjectsApiPaginationResponse = plainToInstance(
	TRGetProjectsApiPaginationResponse,
	{
		offset: 0,
		limit: 250,
		size: 3,
		_links: {
			next: null,
			prev: null,
		},
		projects: [
			{
				id: 1,
				announcement: 'Welcome to project 1',
				completed_on: 1389969184,
				default_role_id: 3,
				default_role: 'Tester',
				is_completed: false,
				name: 'Project 1',
				show_announcement: true,
				suite_mode: 1,
				url: 'https://instance.testrail.io/index.php?/projects/overview/1',
				users: [
					{
						id: 3,
						global_role_id: null,
						global_role: null,
						project_role_id: null,
						project_role: null,
					},
					{
						id: 1,
						global_role_id: null,
						global_role: null,
						project_role_id: null,
						project_role: null,
					},
					{
						id: 5,
						global_role_id: null,
						global_role: null,
						project_role_id: null,
						project_role: null,
					},
					{
						id: 2,
						global_role_id: null,
						global_role: null,
						project_role_id: null,
						project_role: null,
					},
				],
				groups: [],
			},
			{
				id: 2,
				announcement: 'Welcome to project 2',
				completed_on: 1389970184,
				default_role_id: 3,
				default_role: 'Tester',
				is_completed: false,
				name: 'Project 2',
				show_announcement: true,
				suite_mode: 1,
				url: 'https://instance.testrail.io/index.php?/projects/overview/2',
				users: [
					{
						id: 4,
						global_role_id: null,
						global_role: null,
						project_role_id: null,
						project_role: null,
					},
					{
						id: 1,
						global_role_id: null,
						global_role: null,
						project_role_id: null,
						project_role: null,
					},
					{
						id: 5,
						global_role_id: null,
						global_role: null,
						project_role_id: null,
						project_role: null,
					},
					{
						id: 2,
						global_role_id: null,
						global_role: null,
						project_role_id: null,
						project_role: null,
					},
					{
						id: 3,
						global_role_id: null,
						global_role: null,
						project_role_id: null,
						project_role: null,
					},
				],
				groups: [],
			},
			{
				id: 3,
				announcement: 'Welcome to project 3',
				completed_on: 1389971184,
				default_role_id: 3,
				default_role: 'Tester',
				is_completed: false,
				name: 'Project 3',
				show_announcement: true,
				suite_mode: 1,
				url: 'https://instance.testrail.io/index.php?/projects/overview/3',
				users: [
					{
						id: 2,
						global_role_id: null,
						global_role: null,
						project_role_id: null,
						project_role: null,
					},
				],
				groups: [],
			},
		],
	},
);

export const mockTrGetProjectsData = mockApiFactory<TRGetProjectsApiPaginationResponse>(mockTRProjectsResponse);
