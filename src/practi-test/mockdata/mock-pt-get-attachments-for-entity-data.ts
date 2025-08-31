import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';
import { PTGetAttachmentsPaginationResponse } from '../types/attachment.dto';

export const mockPTAttachmentResponse: PTGetAttachmentsPaginationResponse = plainToInstance(
	PTGetAttachmentsPaginationResponse,
	{
		data: [
			{
				id: '14635',
				type: 'attachments',
				attributes: {
					name: 'Screen_Shot_2020-05-25_at_15.32.46.png',
					size: 66220,
				},
			},
		],
	},
);

export const mockPtGetAttachmentsData = mockApiFactory<PTGetAttachmentsPaginationResponse>(mockPTAttachmentResponse);
