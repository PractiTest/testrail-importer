import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

import { PTEntity } from 'src/core/types/migration';

@Entity()
export class PTData<TAttributes = any> {
	@PrimaryColumn('text')
	public id: string;

	@Column('text')
	public type: PTEntity;

	@Column('json')
	public attributes: TAttributes;

	@Column('int')
	public projectId: number;

	@Column({
		type: 'text',
		nullable: true,
	})
	public parentId: string;

	@ManyToOne(() => PTData, { nullable: true }) // Many-to-One self-referencing relationship
	@JoinColumn({ name: 'parentId', referencedColumnName: 'id' })
	public parent: PTData;

	@Column({
		type: 'text',
		nullable: true,
	})
	public parentType: PTEntity;

	@Column({
		type: 'boolean',
		nullable: false,
		'default': false,
	})
	public isAttachmentsFetched: boolean;
}
