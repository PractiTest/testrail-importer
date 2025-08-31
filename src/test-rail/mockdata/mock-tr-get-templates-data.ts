import { TRGetTemplatesApiResponse, TRTemplateDto } from 'src/test-rail/types/template.dto';
import { plainToInstance } from 'class-transformer';
import { mockApiFactory } from 'src/core/utils/mockdata.utils';

// CUSTOM TEMPLATES WON'T BE MIGRATED
export const mockTRTemplatesResponse: TRGetTemplatesApiResponse = plainToInstance(TRTemplateDto, [
	{
		id: 1,
		name: 'Test Case (Text)',
		is_default: true,
	},
	{
		id: 2,
		name: 'Test Case (Steps)',
		is_default: false,
	},
	{
		id: 3,
		name: 'Exploratory Session',
		is_default: false,
	},
	{
		id: 4,
		name: 'Template 4',
		is_default: false,
	},
	{
		id: 5,
		name: 'Template 5',
		is_default: false,
	},
	{
		id: 6,
		name: 'Template 6',
		is_default: false,
	},
	{
		id: 7,
		name: 'Template 7',
		is_default: false,
	},
	{
		id: 8,
		name: 'Template 8',
		is_default: false,
	},
	{
		id: 9,
		name: 'Template 9',
		is_default: false,
	},
	{
		id: 10,
		name: 'Template 10',
		is_default: false,
	},
]);

export const mockTrGetTemplatesData = mockApiFactory<TRGetTemplatesApiResponse>(mockTRTemplatesResponse);
