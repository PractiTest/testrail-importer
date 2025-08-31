import { Expose } from 'class-transformer';

// CUSTOM TEMPLATES WON'T BE MIGRATED
export class TRTemplateDto {
	@Expose({ name: 'is_default' })
	public isDefault: boolean;

	public id: number;
	public name: string;
}

export type TRGetTemplatesApiResponse = TRTemplateDto[];
