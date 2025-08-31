import { Expose, Type } from 'class-transformer';
import { TRBaseApiPaginationResponse } from 'src/test-rail/types/general-types';

export class TRAttachmentDto {
	@Expose({ name: 'created_on' })
	public createdOn: number; // The time/date the attachment was uploaded (timestamp)

	@Expose({ name: 'project_id' })
	public projectId: number; // The ID of the project the attachment was uploaded against

	@Expose({ name: 'case_id' })
	public caseId: number; // The ID of the case the attachment belongs to

	@Expose({ name: 'user_id' })
	public userId: number; // The ID of the user who uploaded the attachment

	@Expose({ name: 'result_id' })
	public resultId?: number; // The test result ID to which the attachment belongs

	@Expose({ name: 'client_id' })
	public clientId?: number | undefined;

	@Expose({ name: 'entity_type' })
	public entityType?: string | undefined;

	@Expose({ name: 'data_id' })
	public dataId?: string | undefined;

	@Expose({ name: 'entity_id' })
	public entityId?: string | undefined;

	@Expose({ name: 'legacy_id' })
	public legacyId: number | undefined;

	@Expose({ name: 'is_image' })
	public isImage?: boolean | undefined;

	public id: string; // The unique ID for the attachment
	public name: string; // Name of the attachment
	public size: number; // Size of the attachment in bytes
	public filename?: string | undefined;
	public filetype?: string | undefined;
	public icon?: string | undefined;
}

export class TRGetAttachmentsApiPaginationResponse extends TRBaseApiPaginationResponse {
	@Type(() => TRAttachmentDto)
	public attachments: TRAttachmentDto[];
}

export class TRGetAttachmentWithDataResponse {
	public data: ArrayBuffer;
	public filename: string;
	public size: number;
}
