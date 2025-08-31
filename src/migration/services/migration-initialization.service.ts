import { Injectable } from '@nestjs/common';
import { select } from '@inquirer/prompts';
import { EMAIL_REGEX, EXCLUDED_FIELDS, REQUIRED_FIELDS } from 'src/migration/constants';
import {
	MigrationDataStatus,
	MigrationEntityStep,
	MigrationEntityStepStage,
	PTEntity,
	TREntity,
} from 'src/core/types/migration';
import { LoggingService } from 'src/core/logging/logging.service';
import { PTCustomFieldDto } from 'src/practi-test/types/custom-field.dto';
import chalk from 'chalk';
import { TRDataService } from 'src/migration-data/services/test-rail-data.service';
import { PTDataService } from 'src/migration-data/services/practi-test-data.service';
import { TRCasesApiService, TRProjectsApiService, TRResultsApiService } from 'src/test-rail/data-services';
import { PTCustomFieldsApiService, PTProjectsApiService } from 'src/practi-test/data-services';
import { IMigrationProcessInfo } from 'src/migration/types/migration-process-info.interface';
import { MigrationDataService } from 'src/migration-data/services/migration-data.service';
import { TRRateLimitService } from 'src/test-rail/http/tr-rate-limit.service';
import { PTRateLimitService } from 'src/practi-test/http/pt-rate-limit.service';
import { TRCustomFieldDto, trPtCustomFieldsMap } from 'src/test-rail/types/custom-field.dto';
import { ConfigService } from '@nestjs/config';
import { TRData } from 'src/core/db/entities/test-rail.entity';
import { ProjectSuiteMode, TRGetProjectsApiPaginationResponse, TRProjectDto } from 'src/test-rail/types/project.dto';
import { TRSuitesApiService } from 'src/test-rail/data-services/suites-api.service';
import { TRSuiteDto } from 'src/test-rail/types/suites.dto';

@Injectable()
export class MigrationInitializationService {
	// eslint-disable-next-line max-params
	constructor(
		private readonly logger: LoggingService,
		private readonly migrationDataService: MigrationDataService,
		private readonly trDataService: TRDataService,
		private readonly ptDataService: PTDataService,
		private readonly trProjectsApiService: TRProjectsApiService,
		private readonly ptProjectsApiService: PTProjectsApiService,
		private readonly trSuitesApiService: TRSuitesApiService,
		private readonly trRateLimitService: TRRateLimitService,
		private readonly ptRateLimitService: PTRateLimitService,
		private readonly trCasesApiService: TRCasesApiService,
		private readonly trResultsApiService: TRResultsApiService,
		private readonly ptCustomFieldsApiService: PTCustomFieldsApiService,
		private readonly configService: ConfigService,
	) {
		this.logger.setContext(MigrationInitializationService.name);
	}

	private readonly fetchTRSuites = async (sourceProjectId: number): Promise<TRSuiteDto[]> => {
		const trGetSuitesByProjectId = this.trRateLimitService.throttle(this.trSuitesApiService.getSuitesByProjectId);

		const limit = 250;
		let page = Math.ceil(0);
		let next: string | null | undefined;
		const trSuiteResults: TRSuiteDto[] = [];
		do {
			const response = await trGetSuitesByProjectId(sourceProjectId, {
				pagination: {
					limit, offset: limit * page
				}
			});
			trSuiteResults.push(...response.suites);
			next = response?._links?.next;
			page++;
			// eslint-disable-next-line no-unmodified-loop-condition
		} while (next);

		return trSuiteResults;
	};

	public initializeNewMigrationWithInteractivePrompt = async (): Promise<IMigrationProcessInfo> => {
		await this.clearAllCachedEntities();
		const sourceProject = await this.promptUserForTRProject();
		const destinationProjectId = await this.promptUserForPTProjectId();
		await this.verifyCustomFields(sourceProject.id, destinationProjectId);

		let sourceProjectSuites: TRSuiteDto[] = [];

		if ((sourceProject.suiteMode = ProjectSuiteMode.MULTI_SUITE)) {
			sourceProjectSuites = await this.fetchTRSuites(sourceProject.id);
		}

		const fallbackUserEmail = this.getFallbackUserEmail();

		const currentMigrationProcessId = (
			await this.migrationDataService.save({
				sourceProjectId: sourceProject.id,
				destinationProjectId,
				fallbackUserEmail,
				status: MigrationDataStatus.NEW,
				createdAt: new Date(),
				migratedEntitySteps: [],
				suiteMode: sourceProject.suiteMode,
				sourceProjectSuites,
			})
		).id;

		return {
			id: currentMigrationProcessId,
			sourceProjectId: sourceProject.id,
			destinationProjectId,
			fallbackUserEmail,
			lastProcessedEntity: undefined,
			initialEntityStep: MigrationEntityStep.USER,
			initialEntityStepStage: MigrationEntityStepStage.PULLING,
			migratedEntitySteps: [],
			suiteMode: sourceProject.suiteMode,
			sourceProjectSuites,
		};
	};

	public initializeIncompleteMigration = async (
		initialEntityStep?: MigrationEntityStep,
	): Promise<IMigrationProcessInfo> => {
		const latestMigration = await this.migrationDataService.getLast();

		if (!latestMigration) {
			throw new Error('You are trying to resume migration, but none found');
		}

		const {
			id,
			sourceProjectId,
			destinationProjectId,
			fallbackUserEmail,
			entityStepStage,
			currentEntity,
			entityStep,
			migratedEntitySteps,
			suiteMode,
			sourceProjectSuites,
		} = latestMigration;

		return {
			id,
			sourceProjectId,
			destinationProjectId,
			fallbackUserEmail,
			initialEntityStepStage: entityStepStage,
			initialEntityStep: initialEntityStep ?? entityStep,
			lastProcessedEntity: currentEntity,
			migratedEntitySteps,
			suiteMode,
			sourceProjectSuites,
		};
	};

	private readonly promptUserForTRProject = async (): Promise<TRProjectDto> => {
		this.logger.log({ message: 'TestRail projects fetching...' });

		const trGetAllProjects = this.trRateLimitService.throttle(this.trProjectsApiService.getAllProjects);
		const projectsData = await trGetAllProjects();
		const trProjects = projectsData instanceof TRGetProjectsApiPaginationResponse ? projectsData.projects : projectsData;

		const selectedProjectId = await select({
			message: 'Select a TestRail project',
			choices: trProjects.map((p) => ({
				name: `[${p.id}] ${p.name}`,
				value: p.id,
			})),
		});

		const selectedProject = trProjects.find((trProject) => trProject.id === selectedProjectId);

		if (!selectedProject) {
			throw new Error('Selected project not found');
		}

		return selectedProject;
	};

	private readonly promptUserForPTProjectId = async (): Promise<number> => {
		this.logger.log({ message: 'PractiTest projects fetching...' });

		const ptGetAllProjects = this.ptRateLimitService.throttle(this.ptProjectsApiService.getAllProjects);
		const { data: ptProjects } = await ptGetAllProjects();

		return select({
			message: 'Select a PractiTest project',
			choices: ptProjects.map((p) => ({
				name: p.attributes.name,
				value: +p.id,
			})),
		});
	};

	private readonly getFallbackUserEmail = (): string | never => {
		const fallbackUserEmail = this.configService.get<string>('FALLBACK_USER_EMAIL', '').toLowerCase();

		if (!EMAIL_REGEX.test(fallbackUserEmail)) {
			throw new Error('Fallback user is specified incorrectly. Please, check ENV variables.');
		}

		if (fallbackUserEmail.includes('@practitest.com')) {
			throw new Error('Fallback user cannot belong to "practitest.com" domain. Please, check ENV variables.');
		}

		return fallbackUserEmail;
	};

	private readonly verifyCustomFields = async (
		sourceProjectId: number,
		destinationProjectId: number,
	): Promise<void> => {
		try {
			let shouldFetchFields = true;
			do {
				await this.ptCustomFieldsApiService.prepareTestRailImport(destinationProjectId);
				const ptCustomFields = await this.fetchPTCustomFields(destinationProjectId);
				const trCaseCustomFieldsData = await this.fetchTRCaseCustomFields(sourceProjectId);
				const trResultCustomFieldsData = await this.fetchTRResultsCustomFields(sourceProjectId);
				const ptCustomFieldsMap = new Map<string, PTCustomFieldDto>();

				for (const ptCustomField of ptCustomFields) {
					ptCustomFieldsMap.set(ptCustomField.attributes.name.toLowerCase(), ptCustomField);
				}

				await this.verifyRequiredCustomFields(ptCustomFieldsMap);
				shouldFetchFields = await this.verifyOptionalCustomFieldsAndAskForRetry(ptCustomFieldsMap, [
					...trCaseCustomFieldsData,
					...trResultCustomFieldsData,
				]);
			} while (shouldFetchFields);
		} catch (e) {
			await this.clearAllCachedEntities();
			throw e;
		}
	};

	private readonly verifyRequiredCustomFields = async (
		ptCustomFieldsMap: Map<string, PTCustomFieldDto>,
	): Promise<void | never> => {
		const missingRequiredFields: string[] = [];
		const wrongTypeRequiredFields: string[] = [];

		for (const trRequiredField of REQUIRED_FIELDS) {
			const ptCustomField = ptCustomFieldsMap.get(trRequiredField.systemName.toLowerCase());

			if (!ptCustomField) {
				missingRequiredFields.push(trRequiredField.systemName);

				continue;
			}

			if (ptCustomField && ptCustomField.attributes.fieldFormat !== trRequiredField.type) {
				wrongTypeRequiredFields.push(trRequiredField.systemName);
			}
		}

		// prevent migration if TR reference custom field does not exist
		if (missingRequiredFields.length > 0 || wrongTypeRequiredFields.length > 0) {
			const message = chalk.red(
				this.generateCustomFieldsWarningMessage(missingRequiredFields, wrongTypeRequiredFields),
			);
			throw new Error(message);
		}
	};

	private readonly verifyOptionalCustomFieldsAndAskForRetry = async (
		ptCustomFieldsMap: Map<string, PTCustomFieldDto>,
		trCustomFields: TRData<TRCustomFieldDto>[],
	): Promise<boolean | never> => {
		const missingFields: string[] = [];
		const wrongTypeFields: string[] = [];

		const customFieldTypesMap = new Map([
			[TREntity.CASE_CUSTOM_FIELD, 'case'],
			[TREntity.RESULT_CUSTOM_FIELD, 'result'],
		]);

		for (const trCaseCustomFieldData of trCustomFields) {
			if (EXCLUDED_FIELDS.includes(trCaseCustomFieldData.attributes.systemName)) {
				continue;
			}

			const ptCustomField = ptCustomFieldsMap.get(trCaseCustomFieldData.attributes.systemName);
			const ptFieldType = trPtCustomFieldsMap.get(trCaseCustomFieldData.attributes.type);

			const formattedFieldString = `${chalk.green(`[${ptFieldType}]`)} ${
				trCaseCustomFieldData.attributes.systemName
			} ${chalk.yellow(`(${customFieldTypesMap.get(trCaseCustomFieldData.type)})`)}`;

			if (!ptCustomField && ptFieldType) {
				missingFields.push(formattedFieldString);

				continue;
			}

			if (ptCustomField && ptCustomField.attributes.fieldFormat !== ptFieldType) {
				wrongTypeFields.push(formattedFieldString);
			}
		}

		if (missingFields.length > 0 || wrongTypeFields.length > 0) {
			const message = `${chalk.yellow('Warning:')}\n${this.generateCustomFieldsWarningMessage(
				missingFields,
				wrongTypeFields,
			)}\nDo you want to continue?`;

			const answer = await select({
				message,
				choices: [
					{ name: 'Ignore and continue', value: 'ignore' },
					{
						name: 'Refetch fields',
						value: 'refetch',
					},
					{ name: 'Abort migration', value: 'abort' },
				],
			});

			switch (answer) {
				case 'refetch':
					return true;
				case 'abort': {
					this.logger.warn({ message: 'User have chosen to abort the process' });
					throw new Error('Process aborted');
				}
				default:
					return false;
			}
		}

		return false;
	};

	private readonly generateCustomFieldsWarningMessage = (
		missingFields: string[],
		wrongTypeFields: string[],
	): string => {
		const missingFieldsMessage = `Custom field${missingFields.length > 1 ? 's' : ''} ${
			missingFields.length > 0
				? `${missingFields.map((field) => chalk.red(field)).join(', ')} ${
						missingFields.length > 1 ? 'are' : 'is'
				  } missing in PractiTest\n`
				: ''
		}`;

		const wrongTypeFieldsMessage = `Custom field${wrongTypeFields.length > 1 ? 's' : ''} ${
			wrongTypeFields.length > 0
				? `${wrongTypeFields.map((field) => chalk.red(field)).join(', ')} ${
						wrongTypeFields.length > 1 ? 'have' : 'has'
				  } wrong type in PractiTest\n`
				: ''
		}`;

		return `${missingFieldsMessage.length > 0 ? missingFieldsMessage : ''}${
			wrongTypeFields.length > 0 ? wrongTypeFieldsMessage : ''
		}`;
	};

	private readonly clearAllCachedEntities = async (): Promise<void> => {
		await this.trDataService.clear();
		await this.ptDataService.clear();
	};

	private readonly fetchPTCustomFields = async (destinationProjectId: number): Promise<PTCustomFieldDto[]> => {
		const ptGetCustomFieldsByProjectId = this.ptRateLimitService.throttle(
			this.ptCustomFieldsApiService.getCustomFieldsByProjectId,
		);

		const customFields: PTCustomFieldDto[] = [];

		let nextPage: number | null | undefined = 1;
		while (nextPage) {
			const response = await ptGetCustomFieldsByProjectId(destinationProjectId, {
				pagination: {
					pageNumber: nextPage,
					pageSize: 250,
				},
			});

			customFields.push(...response.data);
			await this.ptDataService.save(destinationProjectId, PTEntity.CUSTOM_FIELD, response.data);
			nextPage = response?.meta?.nextPage;
		}

		return customFields;
	};

	private readonly fetchTRCaseCustomFields = async (sourceProjectId: number): Promise<TRData<TRCustomFieldDto>[]> => {
		const trGetCaseCustomFields = this.trRateLimitService.throttle(this.trCasesApiService.getCaseCustomFields);
		const customFields: TRCustomFieldDto[] = await trGetCaseCustomFields(sourceProjectId);

		return await this.trDataService.upsert<TRCustomFieldDto>(sourceProjectId, TREntity.CASE_CUSTOM_FIELD, customFields);
	};

	private readonly fetchTRResultsCustomFields = async (
		sourceProjectId: number,
	): Promise<TRData<TRCustomFieldDto>[]> => {
		const trGetResultCustomFields = this.trRateLimitService.throttle(this.trResultsApiService.getResultCustomFields);
		const customFields: TRCustomFieldDto[] = await trGetResultCustomFields(sourceProjectId);

		return await this.trDataService.upsert<TRCustomFieldDto>(
			sourceProjectId,
			TREntity.RESULT_CUSTOM_FIELD,
			customFields,
		);
	};

	// private async fetchTRCaseCustomFields(sourceProjectId: number): Promise<TRCustomFieldDto[]> {
	// 	const trGetCaseCustomFields = this.trRateLimitService.throttle(this.trCasesApiService.getCaseCustomFields);
	// 	const customFields: TRCustomFieldDto[] = await trGetCaseCustomFields(sourceProjectId);
	// 	const customFieldsData = await this.trDataService.upsert<TRCustomFieldDto>(sourceProjectId, TREntity.CASE_CUSTOM_FIELD, customFields);
	//
	// 	return customFields;
	// }
	//
	// private async fetchTRResultsCustomFields(sourceProjectId: number): Promise<TRCustomFieldDto[]> {
	// 	const trGetResultCustomFields = this.trRateLimitService.throttle(this.trResultsApiService.getResultCustomFields);
	// 	const customFields: TRCustomFieldDto[] = await trGetResultCustomFields(sourceProjectId);
	// 	const customFieldsData = await this.trDataService.upsert<TRCustomFieldDto>(sourceProjectId, TREntity.RESULT_CUSTOM_FIELD, customFields);
	//
	// 	return customFields;
	// }
}
