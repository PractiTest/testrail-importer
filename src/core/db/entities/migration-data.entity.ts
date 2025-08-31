import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import {
	MigrationEntityStep,
	MigrationCurrentEntity,
	MigrationDataStatus, MigrationEntityStepStage
} from '../../types/migration';
import { TRSuiteDto } from 'src/test-rail/types/suites.dto';
import { ProjectSuiteMode } from 'src/test-rail/types/project.dto';

@Entity()
export class MigrationData {
	@PrimaryGeneratedColumn('increment')
	public id: number;

	@Column('int')
	public sourceProjectId: number;

	@Column('int')
	public destinationProjectId: number;

	@Column({
		type: 'text',
		nullable: true,
	})
	public fallbackUserEmail: string;

	@Column({
		type: 'int',
		nullable: true,
	})
	public fallbackUserId: number;

	@Column('text')
	public status: MigrationDataStatus;

	@Column({
		type: 'text',
		nullable: true,
	})
	public entityStep: MigrationEntityStep;

	@Column({
		type: 'text',
		nullable: true,
	})
	public entityStepStage: MigrationEntityStepStage;

	@Column({
		type: 'text',
		nullable: true,
	})
	public currentEntity: MigrationCurrentEntity;

	@Column({
		type: 'text',
		nullable: true,
	})
	public error: string;

	@Column('datetime')
	public createdAt: Date;

	@Column({
		type: 'datetime',
		nullable: true,
	})
	public finishedAt: Date;

	@Column({
		type: "json",
		nullable: false,
		'default': '[]'
	})
	public migratedEntitySteps: MigrationEntityStep[];

	@Column({
		type: 'int',
		'default': ProjectSuiteMode.SINGLE_SUITE
	})
	public suiteMode: ProjectSuiteMode;

	@Column({
		type: "json",
		nullable: false,
		'default': '[]'
	})
	public sourceProjectSuites: TRSuiteDto[];
}
