import {
	IPTCustomFields,
	PTApiOptions,
	PTBaseApiPaginationResponse,
	PTBaseApiResponse,
	PTEntityBase,
} from 'src/practi-test/types/general-types';
import { Expose, Transform, Type } from 'class-transformer';
import { Length } from 'class-validator';

export type PTTestAutomatedFieldName =
	| 'automated_test_design'
	| 'script_repository'
	| 'num_of_results'
	| 'suite_path'
	| 'client_type'
	| 'script_path'
	| 'results_path'
	| 'script_name';

export type PTTestAutomatedFields = {
	[key in PTTestAutomatedFieldName]: string;
};

export enum PTTestTypes {
	SCRIPTED_TEST = 'ScriptedTest',
	API_TEST = 'ApiTest',
	FIRE_CRACKER = 'FireCracker',
	XBOT_TEST = 'xBotTest',
	EGGPLANT_TEST = 'EggplantTest',
	BDD_TEST = 'BDDTest',
}

export class PTTestStep {
	@Length(0, 255)
	public name: string;

	@Expose({ name: 'expected-results' })
	public expectedResults: string;

	public description: string;
}

export class PTTestSteps {
	@Type(() => PTTestStep)
	public data: PTTestStep[];
}

export class PTTestStepMigrationData {
	@Type(() => PTTestStep)
	public step: PTTestStep;

	public trAttachmentIds: string[];
}

export class PTNewTestAttributes {
	@Expose({ name: 'author-id', toPlainOnly: true }) // required (unless using PAT)
	public authorId?: number;

	@Expose({ name: 'test-type', toPlainOnly: true }) // By default - ApiTest. Options: ScriptedTest, ApiTest, FireCracker, xBotTest, EggplantTest, BDDTest
	public testType?: string;

	@Expose({ name: 'assigned-to-id', toPlainOnly: true })
	public assignedToId?: number;

	@Expose({ name: 'assigned-to-type', toPlainOnly: true })
	public assignedToType?: any; // Not provided in API docs

	@Expose({ name: 'planned-execution', toPlainOnly: true })
	public plannedExecution?: string; // ISO Date 2017-03-01T12:43:31Z

	@Expose({ name: 'custom-fields', toPlainOnly: true })
	public customFields?: IPTCustomFields;

	@Expose({ name: 'automated-fields', toPlainOnly: true })
	public automatedFields?: PTTestAutomatedFields;

	public name: string;
	public description?: string;
	public status?: string;
	public version?: string;
	public priority?: string;
	public tags?: string[];
}

export class PTNewTestData {
	@Type(() => PTNewTestAttributes)
	public attributes: PTNewTestAttributes;

	@Type(() => PTTestSteps)
	public steps?: PTTestSteps;
}

export class PTUpdateTestAttributes {
	@Expose({ name: 'test-type', toPlainOnly: true }) // By default - ApiTest. Options: ScriptedTest, ApiTest, FireCracker, xBotTest, EggplantTest, BDDTest
	public testType?: string;

	@Expose({ name: 'assigned-to-id', toPlainOnly: true })
	public assignedToId?: number;

	@Expose({ name: 'assigned-to-type', toPlainOnly: true })
	public assignedToType?: any; // Not provided in API docs

	@Expose({ name: 'planned-execution', toPlainOnly: true })
	public plannedExecution?: string; // ISO Date 2017-03-01T12:43:31Z

	@Expose({ name: 'custom-fields', toPlainOnly: true })
	public customFields?: IPTCustomFields;

	@Expose({ name: 'automated-fields', toPlainOnly: true })
	public automatedFields?: PTTestAutomatedFields;

	@Expose({ name: 'updated-by-user-id', toPlainOnly: true })
	public updatedByUserId?: number;

	public name?: string;
	public description?: string;
	public status?: string;
	public version?: string;
	public priority?: string;
	public tags?: string[];
}

export class PTUpdateTestData {
	@Type(() => PTUpdateTestAttributes)
	public attributes: PTUpdateTestAttributes;
}

class TestAttributes {
	@Expose({ name: 'project-id' })
	public projectId?: number;

	@Expose({ name: 'display-id' })
	public displayId?: number;

	@Expose({ name: 'stepsCount' })
	public stepsCount?: number;

	@Expose({ name: 'run-status' })
	public runStatus?: string;

	@Expose({ name: 'last-run' }) // ISO date
	public lastRun?: string;

	@Expose({ name: 'author-id' })
	public authorId: number;

	@Expose({ name: 'assigned-to-id' })
	public assignedToId?: number;

	@Expose({ name: 'assigned-to-type' })
	public assignedToType?: any; // Not provided in API docs

	@Expose({ name: 'cloned-from-id' })
	public clonedFromId?: number; // Not provided in API docs

	@Expose({ name: 'planned-execution' })
	public plannedExecution?: string; // ISO Date 2017-03-01T12:43:31Z

	@Expose({ name: 'duration-estimate' })
	public durationEstimate: string; // "00:00:00"

	@Expose({ name: 'test-type' })
	public testType: string;

	@Expose({ name: 'custom-fields' })
	public customFields: IPTCustomFields;

	@Expose({ name: 'folder-id' })
	public folderId: any; // Not provided in API docs

	@Expose({ name: 'created-at' })
	public createdAt: string;

	@Expose({ name: 'updated-at' })
	public updatedAt?: string;

	public name: string;
	public description: string;
	public status: string;
	public version?: string;
	public priority?: string;
}

export class PTTestDto extends PTEntityBase {
	@Type(() => TestAttributes)
	public attributes: TestAttributes;

	public type: 'tests';
}

export class PTUTestsFilters {
	@Expose({ name: 'filter-id', toPlainOnly: true })
	public filterId?: number;

	@Expose({ name: 'autofilter-value', toPlainOnly: true })
	public autofilterValue?: number;

	@Expose({ name: 'sub-autofilter-value', toPlainOnly: true })
	public subAutofilterValue?: number;

	@Expose({ name: 'filter-user-id', toPlainOnly: true })
	public filterUserId?: number;

	@Expose({ name: 'display-ids', toPlainOnly: true })
	@Transform(({ value }: { value?: string[] | number[] }) => value?.join(','), { toPlainOnly: true })
	public displayIds?: string[] | number[];

	@Expose({ name: 'name_exact', toPlainOnly: true })
	public nameExact?: string;

	@Expose({ name: 'name_like', toPlainOnly: true })
	public nameLike?: string;

	public relationships?: boolean;
}
export class PTGetTestsOptions extends PTApiOptions {
	@Type(() => PTUTestsFilters)
	public filters?: PTUTestsFilters;
}

export class PTGetTestsPaginationResponse extends PTBaseApiPaginationResponse {
	@Type(() => PTTestDto)
	public data: PTTestDto[];
}

export class PTGetTestResponse extends PTBaseApiResponse {
	@Type(() => PTTestDto)
	public data: PTTestDto;
}
