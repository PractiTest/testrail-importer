import { Expose, Transform, Type } from 'class-transformer';
import { PTCustomFieldFormat } from 'src/practi-test/types/custom-field.dto';

export enum TRCustomFieldType {
	STRING = 'string',
	INTEGER = 'integer',
	TEXT = 'text',
	URL = 'url',
	CHECKBOX = 'checkbox',
	DROPDOWN = 'dropdown',
	USER = 'user',
	DATE = 'date',
	MILESTONE = 'milestone',
	STEPS = 'steps',
	STEP_RESULTS = 'step_results',
	MULTISELECT = 'multiselect',
}

const typesMap = new Map<number, string>([
	[1, TRCustomFieldType.STRING],
	[2, TRCustomFieldType.INTEGER],
	[3, TRCustomFieldType.TEXT],
	[4, TRCustomFieldType.URL],
	[5, TRCustomFieldType.CHECKBOX],
	[6, TRCustomFieldType.DROPDOWN],
	[7, TRCustomFieldType.USER],
	[8, TRCustomFieldType.DATE],
	[9, TRCustomFieldType.MILESTONE], // cant be migrated
	[10, TRCustomFieldType.STEPS], // This type can only be used with test cases.
	[11, TRCustomFieldType.STEP_RESULTS], // This type can only be used with test results
	[12, TRCustomFieldType.MULTISELECT],
]);

export const trPtCustomFieldsMap = new Map<TRCustomFieldType, PTCustomFieldFormat>([
	[TRCustomFieldType.STRING, PTCustomFieldFormat.TEXT],
	[TRCustomFieldType.INTEGER, PTCustomFieldFormat.NUMBER],
	[TRCustomFieldType.TEXT, PTCustomFieldFormat.MEMO],
	[TRCustomFieldType.URL, PTCustomFieldFormat.URL],
	[TRCustomFieldType.CHECKBOX, PTCustomFieldFormat.CHECKBOX],
	[TRCustomFieldType.DROPDOWN, PTCustomFieldFormat.LIST],
	[TRCustomFieldType.USER, PTCustomFieldFormat.USER],
	[TRCustomFieldType.DATE, PTCustomFieldFormat.DATE],
	[TRCustomFieldType.MULTISELECT, PTCustomFieldFormat.MULTILIST],
]);

export class TRCustomFieldConfigContext {
	@Expose({ name: 'is_global' })
	public isGlobal: boolean;

	@Expose({ name: 'project_ids' })
	public projectIds: number[];
}

export interface TRCustomFieldSelectItem {
	key: string;
	value: string;
}

export class TRCustomFieldConfigOptions {
	@Expose({ name: 'is_required' })
	public isRequired: boolean;

	@Expose({ name: 'default_value' })
	public defaultValue?: string;

	@Expose({ name: 'has_actual' }) // only for steps & step results
	public hasActual?: boolean;

	@Expose({ name: 'has_expected' }) // only for steps & step results
	public hasExpected?: boolean;

	@Transform(
		({ value }: { value: string }): TRCustomFieldSelectItem[] =>
			value?.split('\n').map((row: string) => {
				const cols = row.split(', ');

				return { key: cols[0], value: cols[1] };
			}) ?? [],
		{ toClassOnly: true },
	)
	public items?: TRCustomFieldSelectItem[];

	public format?: string;
	public rows?: string;
}

export class TRCustomFieldConfig {
	@Type(() => TRCustomFieldConfigContext)
	public context: TRCustomFieldConfigContext;

	@Type(() => TRCustomFieldConfigOptions)
	public options: TRCustomFieldConfigOptions;
}

export class TRCustomFieldDto {
	@Expose({ name: 'system_name' })
	public systemName: string;

	@Expose({ name: 'type_id', toClassOnly: true })
	@Transform(({ value }: { value: number }) => typesMap.get(value))
	public type: TRCustomFieldType;

	@Expose({ name: 'display_order' })
	public displayOrder: number;

	@Type(() => TRCustomFieldConfig)
	public configs: TRCustomFieldConfig[];

	public id: number;
	public description: string;
	public label: string;
	public name: string;
}
