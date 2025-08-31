import {
	MigrationEntityStep, MigrationEntityStepStage,
	PTEntity,
	TREntity
} from 'src/core/types/migration';

export interface StatEntity {
	processed: number;
	failed: number;
}

export type TStatsEntities = {
	[trKey in TREntity as `tr_${trKey}`]?: StatEntity;
} & {
	[ptKey in PTEntity as `pt_${ptKey}`]?: StatEntity;
};


export interface StatsWatchObject {
	stageStart: number; // timestamp
	totalTime: number;
	entities: TStatsEntities;
}

export type TStepStats = {
	[key in MigrationEntityStepStage]: StatsWatchObject;
};

export type TStatistics = {
	[key in MigrationEntityStep]: TStepStats;
};

export enum MigrationExtraEntities {
	TR_PLAN_WITH_ENTRIES = 'tr_plan_with_entries',
}

export type TMigrationEntity = `tr_${TREntity}` | `pt_${PTEntity}` | MigrationExtraEntities;
