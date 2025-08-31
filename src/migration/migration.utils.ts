import { TTRCustomField } from 'src/test-rail/types/general-types';
import { TRCustomFieldDto } from 'src/test-rail/types/custom-field.dto';
import { TRData } from 'src/core/db/entities/test-rail.entity';
import { TRUserDto } from 'src/test-rail/types/user.dto';
import { PTCustomFieldFormat } from 'src/practi-test/types/custom-field.dto';
import { isArray } from 'lodash';
import { formatISO, parse } from 'date-fns';




export function transformCustomFieldValue(
	sourceProjectId: number,
	trValue: TTRCustomField,
	ptFieldFormat: string,
	trFieldType: TRCustomFieldDto,
	trUsersData: TRData<TRUserDto>[],
): string | number | boolean | (string | null)[] | null {
	const currentTrFieldConfig = trFieldType.configs.find(
		(config) => config.context.isGlobal || config.context.projectIds.includes(sourceProjectId),
	);

	switch (ptFieldFormat) {
		case PTCustomFieldFormat.TEXT:
		case PTCustomFieldFormat.URL:
		case PTCustomFieldFormat.MEMO:
			return trValue.toString();

		case PTCustomFieldFormat.NUMBER:
			return Number(trValue);

		case PTCustomFieldFormat.CHECKBOX:
			return !!trValue;

		case PTCustomFieldFormat.LIST:
			return currentTrFieldConfig?.options.items?.find((item) => item.key === trValue.toString())?.value ?? null;
		case PTCustomFieldFormat.MULTILIST:
			if (isArray(trValue))
				return trValue.map(
					(currentValue: number) =>
						currentTrFieldConfig?.options.items?.find((item) => item.key === currentValue.toString())?.value ?? null,
				);

			return [];

		case PTCustomFieldFormat.DATE:
			return formatISO(parse(trValue.toString(), 'MM/dd/yyyy', new Date()));

		case PTCustomFieldFormat.USER:
			const trUserData = trUsersData.find(({ attributes: trUser }) => trUser.id === Number(trValue));

			if (!trUserData?.ptEntityId) {
				return null;
			}

			return trUserData.ptEntityId;
	}

	return null;
}

export function convertDurationToHMS(duration: string): string {
	const parts = duration.split(' ');

	let totalSeconds = 0;

	parts.forEach((part) => {
		const value = parseInt(part);

		if (part.includes('h')) {
			return (totalSeconds += value * 3600);
		}

		if (part.includes('m')) {
			return (totalSeconds += value * 60);
		}

		if (part.includes('s')) {
			return (totalSeconds += value);
		}
	});

	const formattedHours = Math.floor(totalSeconds / 3600);
	const formattedMinutes = Math.floor((totalSeconds % 3600) / 60);
	const formattedSeconds = totalSeconds % 60;

	const hh = formattedHours.toString().padStart(2, '0');
	const mm = formattedMinutes.toString().padStart(2, '0');
	const ss = formattedSeconds.toString().padStart(2, '0');

	return `${hh}:${mm}:${ss}`;
}
