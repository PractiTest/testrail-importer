import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { MigrationData } from 'src/core/db/entities/migration-data.entity';

@Injectable()
export class MigrationDataService {
	@InjectRepository(MigrationData)
	private readonly dataRepository: Repository<MigrationData>;

	public async save(migration: DeepPartial<MigrationData>): Promise<MigrationData> {
		return this.dataRepository.save(migration);
	}

	public async getById(id: number): Promise<MigrationData | null> {
		return await this.dataRepository.findOneBy({ id });
	}

	public async getLast(): Promise<MigrationData | null> {
		return await this.dataRepository.findOne({
			where: {},
			order: {
				id: 'DESC',
			},
		});
	}

	public async updateById(id: number, migration: Partial<MigrationData>): Promise<void> {
		await this.dataRepository.update(id, migration);
	}

	public async deleteById(id: number): Promise<void> {
		await this.dataRepository.delete({ id });
	}
}
