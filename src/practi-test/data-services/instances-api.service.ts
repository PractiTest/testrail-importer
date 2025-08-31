import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import {
	PTGetInstanceResponse,
	PTGetInstancesOptions,
	PTGetInstancesPaginationResponse,
	PTGetInstancesResponse,
	PTNewInstanceData,
	PTUpdateInstanceData,
} from 'src/practi-test/types/instance.dto';
import { mockPtGetInstanceData, mockPtGetInstancesData } from 'src/practi-test/mockdata/mock-pt-get-instances-data';
import { PTApiService } from 'src/practi-test/http/pt-api.service';
import { applyModelDecorators } from 'src/core/utils/model.utils';
import { isNil, omitBy } from 'lodash';

interface IPTInstancesApiService {
	getInstancesByProjectId(
		projectId: number,
		options?: PTGetInstancesOptions,
	): Promise<PTGetInstancesPaginationResponse>;
	createInstance(projectId: number, instanceData: PTNewInstanceData): Promise<PTGetInstanceResponse>;
	updateInstance(
		projectId: number,
		instanceId: number,
		instanceAttributes: PTUpdateInstanceData,
	): Promise<PTGetInstanceResponse>;
	deleteInstance(projectId: number, instanceId: number): Promise<unknown>;
}

@Injectable()
export class PTMockInstancesApiService implements IPTInstancesApiService {
	public getInstancesByProjectId = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: PTGetInstancesOptions,
	): Promise<PTGetInstancesPaginationResponse> => {
		const data = await mockPtGetInstancesData();

		return plainToInstance(PTGetInstancesPaginationResponse, data);
	};

	public createInstance = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		instanceData: PTNewInstanceData,
	): Promise<PTGetInstanceResponse> => {
		const data = await mockPtGetInstanceData();

		return plainToInstance(PTGetInstanceResponse, data);
	};

	public updateInstance = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		instanceId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		instanceData: PTUpdateInstanceData,
	): Promise<PTGetInstanceResponse> => {
		const data = await mockPtGetInstanceData();

		return plainToInstance(PTGetInstanceResponse, data);
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public deleteInstance = async (projectId: number, instanceId: number): Promise<unknown> => Promise.resolve();
}

@Injectable()
export class PTInstancesApiService implements IPTInstancesApiService {
	constructor(private readonly httpService: PTApiService) {}

	public getInstancesByProjectId = async (
		projectId: number,
		options?: PTGetInstancesOptions,
	): Promise<PTGetInstancesPaginationResponse> => {
		const plainOptions = applyModelDecorators(PTGetInstancesOptions, options);
		const params = {
			...omitBy(plainOptions?.filters, isNil),
			...plainOptions?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<PTGetInstancesPaginationResponse>(
			`projects/${projectId}/instances.json`,
			{
				params,
			},
		);

		return plainToInstance(PTGetInstancesPaginationResponse, data);
	};

	public createInstance = async (
		projectId: number,
		instanceData: PTNewInstanceData,
	): Promise<PTGetInstanceResponse> => {
		const body = {
			data: applyModelDecorators(PTNewInstanceData, instanceData),
		};
		const { data } = await this.httpService.axiosRef.post<PTGetInstanceResponse>(
			`projects/${projectId}/instances.json`,
			body,
		);

		return plainToInstance(PTGetInstanceResponse, data);
	};

	public bulkCreateInstances = async (
		projectId: number,
		instancesData: PTNewInstanceData[],
	): Promise<PTGetInstancesResponse> => {
		const body = {
			data: applyModelDecorators(PTNewInstanceData, instancesData),
		};
		const { data } = await this.httpService.axiosRef.post<PTGetInstancesResponse>(
			`projects/${projectId}/instances.json`,
			body,
		);

		return plainToInstance(PTGetInstancesResponse, data);
	};

	public updateInstance = async (
		projectId: number,
		instanceId: number,
		instanceData: PTUpdateInstanceData,
	): Promise<PTGetInstanceResponse> => {
		const body = {
			data: applyModelDecorators(PTUpdateInstanceData, instanceData),
		};
		const { data } = await this.httpService.axiosRef.put<PTGetInstanceResponse>(
			`projects/${projectId}/instances/${instanceId}.json`,
			body,
		);

		return plainToInstance(PTGetInstanceResponse, data);
	};

	public deleteInstance = async (projectId: number, instanceId: number): Promise<unknown> => {
		const { data } = await this.httpService.axiosRef.delete<unknown>(
			`projects/${projectId}/instances/${instanceId}.json`,
		);

		return data;
	};
}
