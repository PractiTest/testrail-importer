import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { mockPtGetAttachmentsData } from 'src/practi-test/mockdata/mock-pt-get-attachments-for-entity-data';
import {
	PTGetAttachmentsPaginationResponse,
	PTNewAttachmentData,
	PTNewAttachmentsResponse,
} from 'src/practi-test/types/attachment.dto';
import { PTApiService } from 'src/practi-test/http/pt-api.service';
import { PTApiOptions } from '../types/general-types';
import { applyModelDecorators } from 'src/core/utils/model.utils';

interface IPTAttachmentsApiService {
	getAttachmentsForEntity(
		projectId: number,
		entity: string,
		entityId: number,
		options?: PTApiOptions,
	): Promise<PTGetAttachmentsPaginationResponse>;
	createAttachmentsForEntity(projectId: number, attachmentData: PTNewAttachmentData): Promise<any>;
}
@Injectable()
export class PTMockAttachmentsApiService implements IPTAttachmentsApiService {
	public getAttachmentsForEntity = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		projectId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		entity: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		entityId: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options?: PTApiOptions,
	): Promise<PTGetAttachmentsPaginationResponse> => {
		const data = await mockPtGetAttachmentsData();

		return plainToInstance(PTGetAttachmentsPaginationResponse, data);
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public createAttachmentsForEntity = async (projectId: number, attachmentData: PTNewAttachmentData): Promise<void> =>
		Promise.resolve();
}

@Injectable()
export class PTAttachmentsApiService implements IPTAttachmentsApiService {
	constructor(private readonly httpService: PTApiService) {}

	public getAttachmentsForEntity = async (
		projectId: number,
		entity: string,
		entityId: number,
		options?: PTApiOptions,
	): Promise<PTGetAttachmentsPaginationResponse> => {
		const plainOptions = applyModelDecorators(PTApiOptions, options);
		const params = {
			entity,
			'entity-id': entityId,
			...plainOptions?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<PTGetAttachmentsPaginationResponse>(
			`projects/${projectId}/attachments.json`,
			{
				params,
			},
		);

		return plainToInstance(PTGetAttachmentsPaginationResponse, data);
	};

	public createAttachmentsForEntity = async (
		projectId: number,
		attachmentData: PTNewAttachmentData,
	): Promise<PTNewAttachmentsResponse> => {
		const body = applyModelDecorators(PTNewAttachmentData, attachmentData);
		const { data } = await this.httpService.axiosRef.post<PTNewAttachmentsResponse>(
			`projects/${projectId}/attachments.json`,
			body,
		);

		return data;
	};
}
