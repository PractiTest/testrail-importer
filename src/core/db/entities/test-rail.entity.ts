import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { MigrationAction, EntityMigrationStatus, TREntity } from 'src/core/types/migration';

@Entity()
@Unique(['id', 'type', 'parentId', 'parentType'])
export class TRData<TAttributes = any> {
	@PrimaryGeneratedColumn('increment')
	public recordId: number; // Surrogate primary key

	@Column('text')
	public id: string;

	@Column('text')
	public type: TREntity;

	@Column({
		type: 'text',
		nullable: true,
	})
	public parentId?: string;

	@Column({
		type: 'text',
		nullable: true,
	})
	public parentType?: TREntity;

	@Column('json')
	public attributes: TAttributes;

	@Column('int')
	public projectId: number;

	@Column({ type: 'int', nullable: true })
	public suiteId?: number;

	@ManyToOne(() => TRData, { nullable: true, createForeignKeyConstraints: false }) // Many-to-One self-referencing relationship
	@JoinColumn([
		{ name: 'parentId', referencedColumnName: 'id' },
		{ name: 'parentType', referencedColumnName: 'type' },
	])
	public parent: TRData;

	@Column({
		type: 'text',
		nullable: true,
	})
	public ptEntityId?: string;

	@Column({
		type: 'text',
		nullable: true,
	})
	public migrationAction: MigrationAction;

	@Column({
		type: 'json',
		nullable: false,
		"default": '{}',
	})
	public migrationData: any;

	// @Column({ type: 'boolean', nullable: false, default: false })
	// public isMigrated: boolean;

	@Column({
		type: 'text',
		nullable: false,
		"default": EntityMigrationStatus.NOT_MIGRATED,
	})
	public migrationStatus: EntityMigrationStatus;

	@Column({
		type: 'boolean',
		nullable: false,
		"default": false,
	})
	public isAttachmentsFetched: boolean;

	@Column({
		type: 'boolean',
		nullable: false,
		"default": false,
	})
	public isResultsFetched: boolean;

	@Column({
		type: 'boolean',
		nullable: false,
		"default": false,
	})
	public isChildItemsFetched: boolean;


	@Column({
		type: 'json',
		nullable: false,
		"default": '[]',
	})
	public errors: any[];
}
