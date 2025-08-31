import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { PTApiService } from 'src/practi-test/http/pt-api.service';
import { applyModelDecorators } from 'src/core/utils/model.utils';
import {
	PTGetCustomFieldResponse,
	PTGetCustomFieldsPaginationResponse,
	PTUpdateCustomFieldData,
} from '../types/custom-field.dto';
import { mockPtGetCustomFieldData, mockPtGetCustomFieldsData } from '../mockdata/mock-pt-get-custom-fields-data';
import { PTApiOptions } from '../types/general-types';

interface IPTCustomFieldsApiService {
	getCustomFieldsByProjectId(projectId: number, options: PTApiOptions): Promise<PTGetCustomFieldsPaginationResponse>;
	getSpecificCustomField(projectId: number, customFieldId: number): Promise<PTGetCustomFieldResponse>;
	updateCustomField(
		projectId: number,
		customFieldId: number,
		customFieldData: PTUpdateCustomFieldData,
	): Promise<PTGetCustomFieldResponse>;

	prepareTestRailImport(projectId: number): Promise<void>;
}

@Injectable()
export class PTMockCustomFieldsApiService implements IPTCustomFieldsApiService {
	public getCustomFieldsByProjectId = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: PTApiOptions,
	): Promise<PTGetCustomFieldsPaginationResponse> => await mockPtGetCustomFieldsData();

	public getSpecificCustomField = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		customFieldId: number,
	): Promise<PTGetCustomFieldResponse> => await mockPtGetCustomFieldData();

	public updateCustomField = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		customFieldId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		customFieldData: PTUpdateCustomFieldData,
	): Promise<PTGetCustomFieldResponse> => await mockPtGetCustomFieldData();

	public prepareTestRailImport = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
	): Promise<void> => {};
}

@Injectable()
export class PTCustomFieldsApiService implements IPTCustomFieldsApiService {
	constructor(private readonly httpService: PTApiService) {}
	public getCustomFieldsByProjectId = async (
		projectId: number,
		options?: PTApiOptions,
	): Promise<PTGetCustomFieldsPaginationResponse> => {
		const params = {
			...options?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<PTGetCustomFieldsPaginationResponse>(
			`projects/${projectId}/custom_fields.json`,
			{
				params,
			},
		);

		return plainToInstance(PTGetCustomFieldsPaginationResponse, data);
	};

	public getSpecificCustomField = async (
		projectId: number,
		customFieldId: number,
	): Promise<PTGetCustomFieldResponse> => {
		const { data } = await this.httpService.axiosRef.get<PTGetCustomFieldResponse>(
			`projects/${projectId}/custom_fields/${customFieldId}.json`,
		);

		return plainToInstance(PTGetCustomFieldResponse, data);
	};

	public updateCustomField = async (
		projectId: number,
		customFieldId: number,
		customFieldData: PTUpdateCustomFieldData,
	): Promise<PTGetCustomFieldResponse> => {
		const body = {
			data: applyModelDecorators(PTUpdateCustomFieldData, customFieldData),
		};
		const { data } = await this.httpService.axiosRef.put<PTGetCustomFieldResponse>(
			`projects/${projectId}/custom_fields/${customFieldId}.json`,
			body,
		);

		return plainToInstance(PTGetCustomFieldResponse, data);
	};

	public prepareTestRailImport = async (projectId: number): Promise<void> => {
		await this.httpService.axiosRef.post(
			`projects/${projectId}/custom_fields/prepare_testrail_import.json`,
		);
	};
}
