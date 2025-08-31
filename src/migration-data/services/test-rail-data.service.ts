import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TREntity } from 'src/core/types/migration';
import { TRData } from 'src/core/db/entities/test-rail.entity';

import { LoggingService } from 'src/core/logging/logging.service';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { FindOptionsRelations } from 'typeorm/find-options/FindOptionsRelations';
import { chunk } from 'lodash';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';

@Injectable()
export class TRDataService {
	@InjectRepository(TRData)
	public readonly dataRepository: Repository<TRData>;

	@Inject(LoggingService)
	private readonly logger: LoggingService;

	public async getOne<TAttributes = any>(type: TREntity, id: string, projectId?: number): Promise<TRData<TAttributes>> {
		const data = await this.findOne(type, {
			id,
			projectId,
		});

		if (!data) {
			throw new Error(`No ${type} found with id ${id}`);
		}

		return data;
	}

	// public async findOne<TAttributes = any>(
	// 	type: TREntity,
	// 	id: string,
	// 	projectId?: number
	// ): Promise<TRData<TAttributes> | null> {
	// 	return await this.dataRepository.findOne({
	// 		where: {
	// 			id,
	// 			projectId,
	// 			type
	// 		}
	// 	});
	// }

	public async get<TAttributes = any>(
		type: TREntity,
		projectId?: number,
		parentType?: TREntity,
		parentId?: string,
	): Promise<Array<TRData<TAttributes>>> {
		const data = await this.dataRepository.find({
			where: { type, projectId, parentId, parentType },
		});

		return data;
	}

	public async count(type: TREntity, projectId?: number, parentType?: TREntity, parentId?: string): Promise<number> {
		return await this.dataRepository.count({
			where: { type, projectId, parentId, parentType },
		});
	}

	public async countBy(
		type: TREntity,
		conditions?: FindOptionsWhere<TRData>[] | FindOptionsWhere<TRData>,
		relations?: FindOptionsRelations<TRData>,
	): Promise<number> {
		return await this.dataRepository.count({
			where: { ...conditions, type },
			relations,
		});
	}

	public async find<TAttributes = any>(
		type: TREntity,
		conditions?: FindOptionsWhere<TRData>[] | FindOptionsWhere<TRData>,
		relations?: FindOptionsRelations<TRData>,
		options?: Omit<FindManyOptions<TRData>, 'where' | 'relations'>,
		limit?: number
	): Promise<Array<TRData<TAttributes>>> {
		const data = await this.dataRepository.find({
			where: { ...conditions, type },
			relations,
			...(options ?? {}),
			...(limit ? { take: limit } : {}),
		});

		return data;
	}

	public async findAndCount<TAttributes = any>(
		type: TREntity,
		conditions?: FindOptionsWhere<TRData>[] | FindOptionsWhere<TRData>,
		relations?: FindOptionsRelations<TRData>,
		options?: Omit<FindManyOptions<TRData>, 'where' | 'relations'>,
	): Promise<[Array<TRData<TAttributes>>, number]> {
		return await this.dataRepository.findAndCount({
			where: { ...conditions, type },
			relations,
			...(options ?? {}),
		});
	}

	public async findOne<TAttributes = any>(
		type: TREntity,
		conditions?: FindOptionsWhere<TRData>[] | FindOptionsWhere<TRData>,
		relations?: FindOptionsRelations<TRData>,
		options?: Omit<FindManyOptions<TRData>, 'where' | 'relations'>,
	): Promise<TRData<TAttributes> | null> {
		return await this.dataRepository.findOne({
			where: { ...conditions, type },
			relations,
			...(options ?? {}),
		});
	}

	public async save<TAttributes = any>(
		projectId: number,
		type: TREntity,
		data: Array<any>,
		parentType?: TREntity,
		parentId?: string,
		suiteId?: number
	): Promise<Array<TRData<TAttributes>>> {
		if (!data.length) {
			return [];
		}

		this.logger.verbose({ message: `TestRail ${type}s saving to cache...` });

		const entities = data.map((d: TRData) => ({
			recordId: d.recordId,
			id: d.id,
			migrationAction: d.migrationAction,
			migrationData: d.migrationData ?? {},
			migrationStatus: d.migrationStatus,
			errors: d.errors ?? [],
			type,
			projectId,
			parentType,
			parentId,
			suiteId,
			ptEntityId: d.ptEntityId,
			attributes: d,
		}));

		const savedData = await this.dataRepository.save(entities, { chunk: 500 });

		this.logger.log({ message: `TestRail ${savedData.length} ${type}s were successfully saved to cache` });

		return savedData;
	}

	public async upsert<TAttributes = any>(
		projectId: number,
		type: TREntity,
		data: Array<any>,
		parentType?: TREntity,
		parentId?: string,
		suiteId?: number
	): Promise<Array<TRData<TAttributes>>> {
		if (!data.length) {
			return [];
		}

		this.logger.verbose({ message: `TestRail ${type}s saving...` });

		const entities = data.map((d: TRData) => ({
			id: d.id,
			migrationAction: d.migrationAction,
			migrationData: d.migrationData ?? {},
			migrationStatus: d.migrationStatus,
			errors: d.errors ?? [],
			type,
			projectId,
			parentType,
			parentId,
			suiteId,
			ptEntityId: d.ptEntityId,
			attributes: d,
		})) as TRData[];

		const savedData = await this.dataRepository.upsert(entities, ['id', 'type', 'parentId', 'parentType']);

		this.logger.log({ message: `TestRail ${savedData.identifiers.length} ${type}s were successfully saved to cache` });

		return entities;
	}

	public async update(data: Array<any>): Promise<void> {
		const chunkedData = chunk(data, 500);

		for (const dataChunk of chunkedData) {
			await this.dataRepository.upsert(dataChunk, { conflictPaths: ['recordId'] });
		}
	}

	public async clear(): Promise<void> {
		await this.dataRepository.clear();
	}
}
