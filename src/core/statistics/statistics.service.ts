import { Injectable } from '@nestjs/common';
import {
	TStepStats, TStatistics, TMigrationEntity, StatEntity, StatsWatchObject
} from 'src/core/statistics/statistics.types';
import { MigrationEntityStep, MigrationEntityStepStage } from 'src/core/types/migration';

import { table, TableUserConfig } from 'table';
import { SpanningCellConfig } from 'table/dist/src/types/api';

@Injectable()
export class StatisticsService {
	public readonly stats = {} as TStatistics;
	public migrationStart: number;
	public migrationEnd: number;

	constructor() {
		for (const entityKey in MigrationEntityStep) {
			const entityStep = MigrationEntityStep[entityKey] as MigrationEntityStep;
			this.stats[entityStep] = {} as TStepStats;
		}
	}

	public captureStart = (): void => {
		this.migrationStart = Date.now();
	};

	public captureEnd = (): void => {
		this.migrationEnd = Date.now();
	};

	public captureMigrationStageStarted = (entityStep: MigrationEntityStep, stage: MigrationEntityStepStage): void => {
		if (this.stats[entityStep][stage]) {
			this.stats[entityStep][stage].stageStart = Date.now();

			return;
		}

		this.stats[entityStep][stage] = this.getInitialStatWatchObject();
	};

	public captureMigrationStageFinished = (entityStep: MigrationEntityStep, stage: MigrationEntityStepStage): void => {
		if (!this.stats[entityStep][stage]) {
			this.stats[entityStep][stage] = this.getInitialStatWatchObject();
		}

		this.stats[entityStep][stage].totalTime += Date.now() - this.stats[entityStep][stage].stageStart;
	};

	public createEntityStatsTable(entityName: string, data: TStepStats): string {
		const header = ['Stage', 'Total Time', 'Entity', 'Processed', 'Failed'];

		const rows: any[][] = [];

		const spanningCells: SpanningCellConfig[] = [];


		for (const [stage, statsWatchObject] of Object.entries(data)) {
			let isFirstStageRow = true;
			const curFirstRowIndex = rows.length + 1;


			for (const [entityName, stats] of Object.entries(statsWatchObject.entities)) {
				rows.push([isFirstStageRow ? stage : '', isFirstStageRow ? this.formatTime(statsWatchObject.totalTime) : '', entityName, stats.processed, stats.failed]);

				isFirstStageRow = false;
			}

			const curRowsCount = rows.length + 1 - curFirstRowIndex;
			const getSpanningCell = (col: number): SpanningCellConfig => ({ col, row: curFirstRowIndex, rowSpan: curRowsCount });

			if (curRowsCount > 0) {
				spanningCells.push(
					getSpanningCell(0),
					getSpanningCell(1)
				);
			}
		}

		rows.unshift(header);


		const tableConfig: TableUserConfig = {
			header: {
				alignment: 'center',
				content: entityName
			},
			columnDefault: {
				alignment: 'center',
				verticalAlignment: 'middle'
			},
			columns: {
				0: { width: 12 },
				1: { width: 14 },
				2: { width: 16 },
				3: { width: 12 },
				4: { width: 12 }
			},
			spanningCells
		};

		return table(rows, tableConfig);
	}

	public getDetailedStats = (): string => {
		const tablesArr = Object.entries(this.stats)
			.filter(([, entityStats]) => Object.keys(entityStats).length > 0)
			.map(([entityName, entityStats]) => this.createEntityStatsTable(entityName, entityStats));

		return `\n${tablesArr.join('')}\nTotal Time: ${this.formatTime((this.migrationEnd ?? Date.now()) - (this.migrationStart ?? Date.now()))}\n`;
	};

	public setProcessedEntitiesCount = (
		entityStep: MigrationEntityStep,
		stage: MigrationEntityStepStage,
		entity: TMigrationEntity,
		value: number,
	): void => {
		this.setStatsCount('processed', entityStep, stage, entity, value);
	};

	public increaseProcessedEntitiesCount = (
		entityStep: MigrationEntityStep,
		stage: MigrationEntityStepStage,
		entity: TMigrationEntity,
		value: number,
	): void => {
		this.increaseStatsCount('processed', entityStep, stage, entity, value);
	};

	public increaseFailedEntitiesCount = (
		entityStep: MigrationEntityStep,
		stage: MigrationEntityStepStage,
		entity: TMigrationEntity,
		value: number,
	): void => {
		this.increaseStatsCount('failed', entityStep, stage, entity, value);
	};

	private getOrInitEntityStats(entityStep: MigrationEntityStep,
															 stage: MigrationEntityStepStage,
															 entity: TMigrationEntity): StatEntity {
		if (!this.stats[entityStep][stage]) {
			this.stats[entityStep][stage] = this.getInitialStatWatchObject();
		}

		const entityData = this.stats[entityStep][stage].entities[entity] as StatEntity | undefined;

		if (entityData) {
			return entityData;
		}

		const newStatEntity: StatEntity = { processed: 0, failed: 0 };
		this.stats[entityStep][stage].entities[entity] = newStatEntity;

		return newStatEntity;
}

	private increaseStatsCount(
		stat: keyof StatEntity,
		entityStep: MigrationEntityStep,
		stage: MigrationEntityStepStage,
		entity: TMigrationEntity,
		value: number,
	): void {
		if (this.stats[entityStep]?.[stage]) {
			const entityData = this.getOrInitEntityStats(entityStep, stage, entity);

			entityData[stat] += value;
		}
	};

	private setStatsCount(
		stat: keyof StatEntity,
		entityStep: MigrationEntityStep,
		stage: MigrationEntityStepStage,
		entity: TMigrationEntity,
		value: number,
	): void {
		if (this.stats[entityStep]?.[stage]) {
			const entityData = this.getOrInitEntityStats(entityStep, stage, entity);

			entityData[stat] = value;
		}
	};

	private readonly formatTime = (duration: number): string => {
		// const duration = intervalToDuration({ start: 0, end: totalTime });

		const zeroPad = (num: number, digits: number = 2): string => String(num).padStart(digits, '0');

		const milliseconds = Math.floor((duration % 1000));
		const seconds = Math.floor((duration / 1000) % 60);
		const minutes = Math.floor((duration / (1000 * 60)) % 60);
		const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

		return `${zeroPad(hours)}:${zeroPad(minutes)}:${zeroPad(seconds)}.${zeroPad(milliseconds, 3)}`;
	};

	private readonly getInitialStatWatchObject = (): StatsWatchObject => ({
		stageStart: Date.now(),
		totalTime: 0,
		entities: {},
	});
}
