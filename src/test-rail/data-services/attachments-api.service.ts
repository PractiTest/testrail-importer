import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import { mockTrGetAttachmentsData } from 'src/test-rail/mockdata/mock-tr-get-attachments-data';
import {
	TRAttachmentDto,
	TRGetAttachmentsApiPaginationResponse, TRGetAttachmentWithDataResponse
} from 'src/test-rail/types/attachment.dto';
import { ITRApiOptions } from '../types/general-types';
import { TRApiService } from 'src/test-rail/http/tr-api.service';
import { HEADER_FILENAME_REGEX } from 'src/test-rail/constants';

export interface ITRAttachmentsApiService {
	getAttachmentsForCase(
		caseId: number | string,
		options: ITRApiOptions,
	): Promise<TRGetAttachmentsApiPaginationResponse>;
	getAttachmentsForPlan(
		planId: number | string,
		options: ITRApiOptions,
	): Promise<TRGetAttachmentsApiPaginationResponse>;
	getAttachmentsForPlanEntry(
		planId: number | string,
		entryId: number | string,
		options: ITRApiOptions,
	): Promise<TRGetAttachmentsApiPaginationResponse>;
	getAttachmentsForRun(runId: number | string, options: ITRApiOptions): Promise<TRGetAttachmentsApiPaginationResponse>;
	getAttachmentsForTest(testId: number | string): Promise<TRAttachmentDto[]>;
	getAttachmentById(attachmentId: string): Promise<ArrayBuffer>;
}

@Injectable()
export class TRMockAttachmentsApiService implements ITRAttachmentsApiService {
	public getAttachmentsForCase = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		caseId: number | string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options: ITRApiOptions,
	): Promise<TRGetAttachmentsApiPaginationResponse> => {
		const data = await mockTrGetAttachmentsData();

		return plainToInstance(TRGetAttachmentsApiPaginationResponse, data);
	};

	public getAttachmentsForPlan = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		planId: number | string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options: ITRApiOptions,
	): Promise<TRGetAttachmentsApiPaginationResponse> => {
		const data = await mockTrGetAttachmentsData();

		return plainToInstance(TRGetAttachmentsApiPaginationResponse, data);
	};

	public getAttachmentsForPlanEntry = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		planId: number | string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		entryId: number | string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options: ITRApiOptions,
	): Promise<TRGetAttachmentsApiPaginationResponse> => {
		const data = await mockTrGetAttachmentsData();

		return plainToInstance(TRGetAttachmentsApiPaginationResponse, data);
	};

	public getAttachmentsForRun = async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		runId: number | string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options: ITRApiOptions,
	): Promise<TRGetAttachmentsApiPaginationResponse> => {
		const data = await mockTrGetAttachmentsData();

		return plainToInstance(TRGetAttachmentsApiPaginationResponse, data);
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getAttachmentsForTest = async (testId: number | string): Promise<TRAttachmentDto[]> => {
		const { attachments } = await mockTrGetAttachmentsData();

		return plainToInstance(TRAttachmentDto, attachments);
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getAttachmentById = async (attachmentId: string): Promise<any> => Promise.resolve();
}

@Injectable()
export class TRAttachmentsApiService implements ITRAttachmentsApiService {
	constructor(private readonly httpService: TRApiService) {}

	public getAttachmentsForCase = async (
		caseId: number | string,
		options?: ITRApiOptions,
	): Promise<TRGetAttachmentsApiPaginationResponse> => {
		const params = {
			...options?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<TRGetAttachmentsApiPaginationResponse | TRAttachmentDto[]>(
			`get_attachments_for_case/${caseId}`,
			{
				params,
			},
		);

		if (Array.isArray(data)) {
			return plainToInstance(TRGetAttachmentsApiPaginationResponse, { attachments: data });
		}

		return plainToInstance(TRGetAttachmentsApiPaginationResponse, data);
	};

	public getAttachmentsForPlan = async (
		planId: number | string,
		options?: ITRApiOptions,
	): Promise<TRGetAttachmentsApiPaginationResponse> => {
		const params = {
			...options?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<TRGetAttachmentsApiPaginationResponse | TRAttachmentDto[]>(
			`get_attachments_for_plan/${planId}`,
			{
				params,
			},
		);

		if (Array.isArray(data)) {
			return plainToInstance(TRGetAttachmentsApiPaginationResponse, { attachments: data });
		}

		return plainToInstance(TRGetAttachmentsApiPaginationResponse, data);
	};

	public getAttachmentsForPlanEntry = async (
		planId: number | string,
		entryId: number | string,
		options?: ITRApiOptions,
	): Promise<TRGetAttachmentsApiPaginationResponse> => {
		const params = {
			...options?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<TRGetAttachmentsApiPaginationResponse | TRAttachmentDto[]>(
			`get_attachments_for_plan_entry/${planId}/${entryId}`,
			{
				params,
			},
		);

		if (Array.isArray(data)) {
			return plainToInstance(TRGetAttachmentsApiPaginationResponse, { attachments: data });
		}

		return plainToInstance(TRGetAttachmentsApiPaginationResponse, data);
	};

	public getAttachmentsForRun = async (
		runId: number | string,
		options?: ITRApiOptions,
	): Promise<TRGetAttachmentsApiPaginationResponse> => {
		const params = {
			...options?.pagination,
		};
		const { data } = await this.httpService.axiosRef.get<TRGetAttachmentsApiPaginationResponse | TRAttachmentDto[]>(
			`get_attachments_for_run/${runId}`,
			{
				params,
			},
		);

		if (Array.isArray(data)) {
			return plainToInstance(TRGetAttachmentsApiPaginationResponse, { attachments: data });
		}

		return plainToInstance(TRGetAttachmentsApiPaginationResponse, data);
	};

	public getAttachmentsForTest = async (testId: number | string): Promise<TRAttachmentDto[]> => {
		const { data } = await this.httpService.axiosRef.get<TRAttachmentDto[]>(`get_attachments_for_test/${testId}`);

		return plainToInstance(TRAttachmentDto, data);
	};

	public getAttachmentById = async (attachmentId: string): Promise<ArrayBuffer> => {
		const { data } = await this.httpService.axiosRef.get<ArrayBuffer>(`get_attachment/${attachmentId}`, {
			responseType: 'arraybuffer',
		});

		return data;
	};

	public getAttachmentWithDetailsById = async (attachmentId: string): Promise<TRGetAttachmentWithDataResponse> => {
		const { data, headers } = await this.httpService.axiosRef.get<ArrayBuffer>(`get_attachment/${attachmentId}`, {
			responseType: 'arraybuffer',
		});

		const headerLine = headers['content-disposition'] as string | undefined ?? '';
		const filename = decodeURI(headerLine.match(HEADER_FILENAME_REGEX)?.[0] ?? `file_${attachmentId}`);

		return { data, filename, size: data.byteLength };
	};
}
