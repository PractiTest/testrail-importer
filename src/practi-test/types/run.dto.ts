import {
	IPTCustomFields,
	PTApiOptions,
	PTBaseApiArrayResponse,
	PTBaseApiPaginationResponse,
	PTBaseApiResponse,
	PTEntityBase,
} from 'src/practi-test/types/general-types';
import { Expose, Transform, Type } from 'class-transformer';
import { Length } from 'class-validator';
import { PTFiles } from 'src/practi-test/types/file.dto';

export type PTRunStepStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'NO RUN' | 'N/A';

export class PTRunStep {
	@Length(0, 255)
	public name: string;

	@Expose({ name: 'expected-results' })
	public expectedResults?: string;

	@Expose({ name: 'actual-results' })
	public actualResults?: string;

	@Type(() => PTFiles)
	public files?: PTFiles;

	public description?: string;

	public status: PTRunStepStatus;
}

export class PTRunSteps {
	@Type(() => PTRunStep)
	public data: PTRunStep[];
}

export enum PTRunType {
	AUTOMATED_RUN = 'AutomatedRun',
	MANUAL_RUN = 'ManualRun',
}

export class PTRunStepMigration {
	@Type(() => PTRunStep)
	public step: PTRunStep;

	public trAttachmentIds: string[];
}

export class PTRunStepsMigrationData {
	@Type(() => PTRunStepMigration)
	public data: PTRunStepMigration[];
}

class PTNewRunAttributes {
	@Expose({ name: 'instance-id', toPlainOnly: true })
	public instanceId: number;

	@Expose({ name: 'exit-code', toPlainOnly: true })
	public exitCode?: number; // 0 for passed, otherwise failed

	@Expose({ name: 'run-type', toPlainOnly: true }) // AutomatedRun, ManualRun (default is AutomatedRun)
	public runType?: PTRunType;

	@Expose({ name: 'run-date', toPlainOnly: true }) // date field of run-date - ManualRun only
	public runDate?: string;

	@Expose({ name: 'tester-id', toPlainOnly: true }) // tester user-id - used - ManualRun only, required for ManualRun
	public testerId?: number;

	@Expose({ name: 'run-duration', toPlainOnly: true })
	public runDuration?: string; // "00:53:20"

	@Expose({ name: 'automated-execution-output', toPlainOnly: true })
	@Length(0, 255)
	public automatedExecutionOutput?: string;

	@Expose({ name: 'custom-fields', toPlainOnly: true })
	public customFields?: IPTCustomFields;

	public version?: string; // "2"
}

export class PTNewRunData {
	@Type(() => PTNewRunAttributes)
	public attributes: PTNewRunAttributes;

	@Type(() => PTRunSteps)
	public steps?: PTRunSteps; // TODO recheck and remove it

	@Type(() => PTFiles)
	public files?: PTFiles;
}

class RunAttributes {
	@Expose({ name: 'project-id' })
	public projectId?: number;

	@Expose({ name: 'tester-id' })
	public testerId: number;

	@Expose({ name: 'instance-id' })
	public instanceId: number;

	@Expose({ name: 'test-id' })
	public testId: number;

	@Expose({ name: 'run-type' })
	public runType: string;

	@Expose({ name: 'custom-fields' })
	public customFields: IPTCustomFields;

	@Expose({ name: 'automated-execution-output' })
	public automatedExecutionOutput: string;

	@Expose({ name: 'run-duration' })
	public runDuration: string; // "00:53:20"

	@Expose({ name: 'created-at' }) // ISO date "2017-03-07T11:10:42+02:00"
	public createdAt: string;

	@Expose({ name: 'updated-at' })
	public updatedAt?: string;

	public status: string;
	public preconditions: any; // Not provided in API docs
	public version?: string; // "2"
}

export class PTRunDto extends PTEntityBase {
	@Type(() => RunAttributes)
	public attributes: RunAttributes;

	public type: 'runs';
}

export class PTURunsFilters {
	@Expose({ name: 'test-ids', toPlainOnly: true })
	@Transform(({ value }: { value?: string[] | number[] }) => value?.join(','), { toPlainOnly: true })
	public testIds?: string[] | number[];

	@Expose({ name: 'set-ids', toPlainOnly: true })
	@Transform(({ value }: { value?: string[] | number[] }) => value?.join(','), { toPlainOnly: true })
	public setIds?: string[] | number[];

	@Expose({ name: 'instance-ids', toPlainOnly: true })
	@Transform(({ value }: { value?: string[] | number[] }) => value?.join(','), { toPlainOnly: true })
	public instanceIds?: string[] | number[];

	@Expose({ name: 'run-type', toPlainOnly: true })
	public runType?: 'AutomatedRun' | 'ManualRun';

	@Expose({ name: 'set-filter-id', toPlainOnly: true })
	public setFilterId?: number;

	@Expose({ name: 'set-filter-user-id', toPlainOnly: true })
	public setFilterUserId?: number;

	@Expose({ name: 'updated-hours-ago', toPlainOnly: true })
	public updatedHoursAgo?: number;
}
export class PTGetRunsOptions extends PTApiOptions {
	@Type(() => PTURunsFilters)
	public filters?: PTURunsFilters;
}

export class PTGetRunsPaginationResponse extends PTBaseApiPaginationResponse {
	@Type(() => PTRunDto)
	public data: PTRunDto[];
}

export class PTGetRunResponse extends PTBaseApiResponse {
	@Type(() => PTRunDto)
	public data: PTRunDto;
}

export class PTGetRunsResponse extends PTBaseApiArrayResponse {
	@Type(() => PTRunDto)
	public data: PTRunDto[];
}
