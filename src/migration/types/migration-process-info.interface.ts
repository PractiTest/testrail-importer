import {
	MigrationCurrentEntity,
	MigrationEntityStep,
	MigrationEntityStepStage
} from 'src/core/types/migration';
import { TRSuiteDto } from 'src/test-rail/types/suites.dto';
import { ProjectSuiteMode } from 'src/test-rail/types/project.dto';

export interface IMigrationProcessInfo {
	id: number;
	fallbackUserEmail: string;
	sourceProjectId: number;
	destinationProjectId: number;

	initialEntityStep: MigrationEntityStep;
	initialEntityStepStage: MigrationEntityStepStage;
	lastProcessedEntity?: MigrationCurrentEntity;

	migratedEntitySteps: MigrationEntityStep[];

	suiteMode: ProjectSuiteMode;
	sourceProjectSuites: TRSuiteDto[];
}
