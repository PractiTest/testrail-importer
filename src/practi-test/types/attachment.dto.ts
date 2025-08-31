import { PTBaseApiArrayResponse, PTBaseApiPaginationResponse, PTEntityBase } from 'src/practi-test/types/general-types';
import { Expose, Type } from 'class-transformer';
import { PTFiles } from 'src/practi-test/types/file.dto';
import { TREntity } from 'src/core/types/migration';

export enum PTAttachmentEntities {
	REQUIREMENT = 'requirement',
	TEST = 'test',
	TEST_SET = 'testset',
	INSTANCE = 'instance',
	STEP = 'step',
	STEP_RUN = 'step-run',
	ISSUE = 'issue',
}

export const TRAttachmentEntitiesMap = new Map<TREntity, PTAttachmentEntities>([
	[TREntity.CASE, PTAttachmentEntities.TEST],
	[TREntity.RUN, PTAttachmentEntities.TEST_SET],
	[TREntity.TEST, PTAttachmentEntities.INSTANCE],
]);

export class PTNewAttachmentDataAttributes {
	@Type(() => PTFiles)
	public files: PTFiles;

	public type: 'attachments';
}

export class PTNewAttachmentData {
	@Expose({ name: 'entity-id', toPlainOnly: true })
	public entityId: number;

	public entity: PTAttachmentEntities;

	public data: PTNewAttachmentDataAttributes;
}

export class PTAttachmentAttributes {
	public name: string;
	public size: number;
}

export class PTAttachmentDto extends PTEntityBase {
	@Type(() => PTAttachmentAttributes)
	public attributes: PTAttachmentAttributes;

	public type: 'attachments';
}

export class PTGetAttachmentsPaginationResponse extends PTBaseApiPaginationResponse {
	@Type(() => PTAttachmentDto)
	public data: PTAttachmentDto[];
}

export class PTNewAttachmentsResponse extends PTBaseApiArrayResponse {
	@Type(() => PTAttachmentDto)
	public data: PTAttachmentDto[];
}
