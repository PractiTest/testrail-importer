import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PTEntity } from 'src/core/types/migration';
import { PTData } from 'src/core/db/entities/practi-test.entity';

import { LoggingService } from 'src/core/logging/logging.service';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { FindOptionsRelations } from 'typeorm/find-options/FindOptionsRelations';

@Injectable()
export class PTDataService {
	constructor(
		@InjectRepository(PTData) private readonly dataRepository: Repository<PTData>,
		private readonly logger: LoggingService,
	) {
		this.logger.setContext('PractiTest Cache');
	}

	public async get<TAttributes = any>(
		type: PTEntity,
		projectId?: number,
		parentType?: PTEntity,
		parentId?: string,
	): Promise<Array<PTData<TAttributes>>> {
		return await this.dataRepository.find({
			where: { type, projectId, parentType, parentId },
		});
	}

	public async count(type: PTEntity, projectId?: number, parentType?: PTEntity, parentId?: string): Promise<number> {
		return await this.dataRepository.count({
			where: { type, projectId, parentType, parentId },
		});
	}

	public async countBy(
		type: PTEntity,
		conditions?: FindOptionsWhere<PTData>[] | FindOptionsWhere<PTData>,
		relations?: FindOptionsRelations<PTData>,
	): Promise<number> {
		return await this.dataRepository.count({
			where: { ...conditions, type },
			relations,
		});
	}

	public async find<TAttributes = any>(
		type: PTEntity,
		conditions?: FindOptionsWhere<PTData>[] | FindOptionsWhere<PTData>,
		relations?: FindOptionsRelations<PTData>,
	): Promise<Array<PTData<TAttributes>>> {
		const data = await this.dataRepository.find({
			where: { ...conditions, type },
			relations,
		});

		return data;
	}

	public async save(
		projectId: number,
		type: PTEntity,
		data: Array<any>,
		parentType?: PTEntity,
		parentId?: string,
	): Promise<Array<PTData>> {
		if (!data.length) {
			return [];
		}

		this.logger.verbose({
			message: `PractiTest ${type}s saving...`,
			entitiesIds: data.map((d: PTData) => d.id),
		});

		const entities = data.map((d: PTData) => ({
			id: d.id?.toString(),
			type,
			projectId,
			parentType,
			parentId,
			attributes: d,
		}));

		const savedData = await this.dataRepository.save(entities, { chunk: 500 });

		this.logger.log({
			message: `PractiTest ${savedData.length} ${type}s were successfully saved`,
			entitiesIds: data.map((d: PTData) => d.id),
		});

		return savedData;
	}

	public async saveWithParent(
		projectId: number,
		type: PTEntity,
		data: Array<any>,
	): Promise<Array<PTData>> {
		if (!data.length) {
			return [];
		}

		this.logger.verbose({
			message: `PractiTest ${type}s saving...`,
			entitiesIds: data.map((d: PTData) => d.id),
		});

		const entities = data.map((d: PTData) => ({
			id: d.id?.toString(),
			type,
			projectId,
			parentType: d.parentType,
			parentId: d.parentId,
			attributes: d,
		}));

		const savedData = await this.dataRepository.save(entities, { chunk: 500 });

		this.logger.log({
			message: `PractiTest ${savedData.length} ${type}s were successfully saved`,
			entitiesIds: data.map((d: PTData) => d.id),
		});

		return savedData;
	}

	public async upsert<TAttributes = any>(
		projectId: number,
		type: PTEntity,
		data: Array<any>,
		parentType?: PTEntity,
		parentId?: string,
	): Promise<Array<PTData<TAttributes>>> {
		if (!data.length) {
			return [];
		}

		this.logger.verbose({
			message: `PractiTest ${type}s upserting...`,
			entitiesIds: data.map((d: PTData) => d.id),
		});

		const entities = data.map((d: PTData) => ({
			id: d.id?.toString(),
			type,
			projectId,
			parentType,
			parentId,
			attributes: d,
		})) as PTData[];

		const savedData = await this.dataRepository.upsert(entities, ['id']);

		this.logger.log({
			message: `PractiTest ${savedData.identifiers?.length} ${type}s were successfully upserted`,
			entitiesIds: data.map((d: PTData) => d.id),
		});

		return entities;
	}

	public async update(data: Array<any>): Promise<void> {
		this.logger.verbose({
			message: `Updating ${data?.length} PractiTest records...`,
			entitiesIds: data.map((d: PTData) => d.id),
		});
		await this.dataRepository.upsert(data, ['id']);
		this.logger.log({
			message: `Updated ${data?.length} PractiTest records...`,
			entitiesIds: data.map((d: PTData) => d.id),
		});
	}

	public async clear(): Promise<void> {
		this.logger.verbose({
			message: `Clearing all the cache records...`,
		});

		await this.dataRepository.clear();

		this.logger.log({
			message: `Cleared all the cache records...`,
		});
	}
}
