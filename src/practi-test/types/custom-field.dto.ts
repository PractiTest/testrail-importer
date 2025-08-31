import { PTBaseApiPaginationResponse, PTBaseApiResponse, PTEntityBase } from 'src/practi-test/types/general-types';
import { Expose, Type } from 'class-transformer';

export enum PTTestCustomFieldsList {
	TESTRAIL_CASE_ID = 'TestRailCaseID',
	TESTRAIL_RUN_ID = 'TestRailRunID',
	TESTRAIL_TEST_ID = 'TestRailTestID',
	TESTRAIL_SECTION = 'TestRailSection',
	TESTRAIL_RUN_CONFIG = 'TestRailConfiguration',
	TESTRAIL_RESULT_ID = 'TestRailResultID',
}

export class PTUpdateCustomFieldAttributes {
	@Expose({ name: 'possible-values', toPlainOnly: true })
	public possibleValues: any[]; // values that can be set for a custom field

	@Expose({ name: 'parent-list-id', toPlainOnly: true })
	public parentListId?: number; // the id of a parent list that can be set for a “linked list” custom field

	@Expose({ name: 'possible-values-parent-cf-id', toPlainOnly: true })
	public possibleValuesParentCfId?: number; // the id of an existing list where you can take values for a custom field

	public name: string;
}

export class PTUpdateCustomFieldData {
	@Type(() => PTUpdateCustomFieldAttributes)
	public attributes: PTUpdateCustomFieldAttributes;
}

export enum PTCustomFieldFormat {
	MULTILIST = 'multilist', // Allows you to select several values simultaneously
	LIST = 'list', //  Predefined list of values to choose from
	TEXT = 'text', // Regular text field
	// LINKED_LIST 'linkedlist', // specify a set of “child-lists” with different sets of values for another list defined in the system.
	MEMO = 'memo', // Large text area
	NUMBER = 'number', // Field for number values
	CHECKBOX = 'checkbox', // Check box field (boolean)
	DATE = 'date', // Field that accepts dates only (e.g. "12/11/2023" (means 2023-12-11))
	USER = 'user', // Project user field.
	URL = 'url', // Adding a website link
}

export class PTCustomFieldAttributes {
	@Expose({ name: 'field-format' })
	public fieldFormat: PTCustomFieldFormat;

	@Expose({ name: 'project-id' })
	public projectId: number;

	@Expose({ name: 'possible-values' })
	public possibleValues: any[];

	@Expose({ name: 'parent-list-id' })
	public parentListId?: number;

	@Expose({ name: 'possible-values-parent-cf-id' })
	public possibleValuesParentCfId?: number;

	@Expose({ name: 'created-at' })
	public createdAt: string;

	@Expose({ name: 'updated-at' })
	public updatedAt?: string;

	public name: string;
}

export class PTCustomFieldDto extends PTEntityBase {
	@Type(() => PTCustomFieldAttributes)
	public attributes: PTCustomFieldAttributes;

	public type: 'custom-fields';
}

export class PTGetCustomFieldsPaginationResponse extends PTBaseApiPaginationResponse {
	@Type(() => PTCustomFieldDto)
	public data: PTCustomFieldDto[];
}

export class PTGetCustomFieldResponse extends PTBaseApiResponse {
	@Type(() => PTCustomFieldDto)
	public data: PTCustomFieldDto;
}
