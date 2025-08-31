import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Not } from 'typeorm';

import { EntityMigrationService } from './entity-migration.service';

import {
	EntityMigrationStatus,
	MigrationAction,
	MigrationEntityStep,
	MigrationEntityStepStage,
	PTEntity,
	TREntity,
} from 'src/core/types/migration';
import { TRUsersApiService } from 'src/test-rail/data-services';
import { PTGroupsApiService, PTUsersApiService } from 'src/practi-test/data-services';
import { PTUserDto } from 'src/practi-test/types/user.dto';
import { TRRateLimitService } from 'src/test-rail/http/tr-rate-limit.service';
import { PTRateLimitService } from 'src/practi-test/http/pt-rate-limit.service';
import { TRUserDto, TRUserMigrationData, TRUserRole } from 'src/test-rail/types/user.dto';
import { TRData } from 'src/core/db/entities/test-rail.entity';
import { executeAllChunkedAsync } from 'src/core/utils/api.utils';
import { PTData } from 'src/core/db/entities/practi-test.entity';
import { PTDefaultGroupName, PTGroupDto } from 'src/practi-test/types/group.dto';
import { PTUpdateUserProjectGroups, PTUserProjectDto } from 'src/practi-test/types/user-project.dto';
import { LoggingService } from 'src/core/logging/logging.service';
import {
	IS_TESTRAIL_CLOUD_INSTANCE,
	MIGRATION_CHUNK_SIZE_MULTIPLIERS,
	MIGRATION_ENTITY_STEPS_ENV_MAP,
	MIGRATION_ENTITY_STEPS_SEQUENCE
} from 'src/migration/config/configuration';
import { IMigrationProcessInfo } from 'src/migration/types/migration-process-info.interface';
import { IAppConfig } from 'src/core/types/app.config';

@Injectable()
export class UserMigrationService extends EntityMigrationService {
	protected type = MigrationEntityStep.USER;

	constructor(
		private readonly trUsersApiService: TRUsersApiService,
		private readonly ptUsersApiService: PTUsersApiService,
		private readonly ptGroupsApiService: PTGroupsApiService,
		private readonly ptRateLimitService: PTRateLimitService,
		private readonly trRateLimitService: TRRateLimitService,
		private readonly configService: ConfigService<IAppConfig>,
		protected readonly logger: LoggingService,
	) {
		super();
		logger.setContext(UserMigrationService.name);
	}

	public getShouldExecuteEntityMigration = async (migrationProcess: IMigrationProcessInfo): Promise<boolean> => {
		if (migrationProcess.migratedEntitySteps.includes(MigrationEntityStep.USER)) {
			return false;
		}

		const initialEntityIndex = MIGRATION_ENTITY_STEPS_SEQUENCE.indexOf(migrationProcess.initialEntityStep);
		const currentEntityIndex = MIGRATION_ENTITY_STEPS_SEQUENCE.indexOf(MigrationEntityStep.USER);

		return (
			(initialEntityIndex <= currentEntityIndex) &&
			!!MIGRATION_ENTITY_STEPS_ENV_MAP.get(MigrationEntityStep.USER)
		);
	};

	public pullAllRequiredData = async (): Promise<void> => {
		await Promise.all([this.fetchPTUsers(), this.fetchPTUserGroups()]);
	};

	public pullNextTrDataPortion = async (): Promise<boolean> => {
		// fetching TestRail users, PractiTest users, PractiTest user groups
		const [trUsersData, ptUsersData] = await Promise.all([
			this.fetchTRUsers(),
			this.ptDataService.get<PTUserDto>(PTEntity.USER, this.destinationProjectId),
		]);

		const filteredPtUserData = ptUsersData.filter(
			(ptUser) => !ptUser.attributes.attributes.email.includes('practitest.com'),
		);
		const filteredTrUserData = trUsersData.filter((ptUser) => !ptUser.attributes.email.includes('practitest.com'));

		const chunkSize =
			this.configService.get('ENABLE_CHUNKED_PUSH', 'false') === 'true'
				? Math.ceil(+this.configService.get('PRACTITEST_API_LIMIT', 100) * MIGRATION_CHUNK_SIZE_MULTIPLIERS.USERS)
				: 1;

		const newTrUsersData = await executeAllChunkedAsync(
			filteredTrUserData,
			chunkSize, // chunk size
			async (trUserData) => {
				const ptUserData = filteredPtUserData.find(
					({ attributes: ptUser }) =>
						ptUser.attributes.email.toLowerCase() === trUserData.attributes.email.toLowerCase(),
				);

				if (ptUserData) {
					trUserData.ptEntityId = ptUserData.id;

					// fetching projects list for each PractiTest user
					const userProjects = await this.fetchPTUserProjects(trUserData.ptEntityId);
					trUserData.migrationData = {
						isNew: false,
						projects: userProjects.map((project) => ({
							id: Number(project.id),
							groups: project.attributes.groups.map((group) => ({ id: Number(group.id) })),
						})),
					};
				}

				return {
					...trUserData,
					migrationAction: !!ptUserData ? MigrationAction.UPDATE : MigrationAction.INSERT,
				};
			},
		);

		await this.trDataService.update(newTrUsersData);

		// Always returns false as we process all the users at once
		return false;
	};

	public compareAwaitingData = async (): Promise<void> => {
		const trUsersData = await this.trDataService.get<TRUserDto>(TREntity.USER);
		const ptUserGroupsData = await this.ptDataService.get<PTGroupDto>(PTEntity.GROUP);

		const newTrUsersData = trUsersData.map((trUserData) => {
			if (trUserData.attributes.email.includes('@practitest.com') || trUserData.ptEntityId) {
				return { ...trUserData, migrationAction: MigrationAction.IGNORE };
			}

			if (!trUserData.attributes.role) {
				trUserData.attributes.role = TRUserRole.TESTER;
			}

			if (!trUserData.attributes.isActive) {
				return trUserData;
			}

			if (trUserData.attributes.role === TRUserRole.TESTER) {
				return this.handleProjectRoles(trUserData, ptUserGroupsData, PTDefaultGroupName.TESTERS);
			}

			if (trUserData.attributes.role === TRUserRole.LEAD) {
				return this.handleProjectRoles(trUserData, ptUserGroupsData, PTDefaultGroupName.ADMINISTRATORS);
			}

			return trUserData;
		});

		this.statisticsService.setProcessedEntitiesCount(
			this.type,
			MigrationEntityStepStage.COMPARING,
			'tr_user',
			newTrUsersData.length,
		);

		await this.trDataService.update(newTrUsersData);
	};

	public verifyPreviouslyUnfinishedData = async (): Promise<void> => {
		const trUsersData = await this.trDataService.find<TRUserDto>(TREntity.USER, {
			projectId: this.sourceProjectId,
			migrationStatus: EntityMigrationStatus.PENDING,
		});

		const ptGetUsers = this.ptRateLimitService.throttle(this.ptUsersApiService.getUsers);

		const pageSize = 250;

		const ptUsers: PTUserDto[] = [];

		let nextPage: number | null | undefined = 1;
		while (nextPage) {
			const response = await ptGetUsers({
				pagination: {
					pageNumber: nextPage,
					pageSize,
				},
			});
			ptUsers.push(...response.data);
			nextPage = response?.meta?.nextPage;
		}

		for (const trUserData of trUsersData) {
			const ptUser = ptUsers.find((ptUser) => ptUser.attributes.email === trUserData.attributes.email);

			if (ptUser) {
				await this.trDataService.update([
					{ ...trUserData, migrationStatus: EntityMigrationStatus.MIGRATED, ptEntityId: ptUser.id },
				]);

				continue;
			}

			await this.trDataService.update([{ ...trUserData, migrationStatus: EntityMigrationStatus.NOT_MIGRATED }]);
		}
	};

	public pushData = async (): Promise<void> => {
		const trUsersData = await this.trDataService.find<TRUserDto>(TREntity.USER, {
			projectId: this.sourceProjectId,
			migrationAction: Not(MigrationAction.IGNORE),
			migrationStatus: EntityMigrationStatus.NOT_MIGRATED,
		});

		const ptUsersData = await this.ptDataService.get<PTUserDto>(PTEntity.USER);
		const ptUserGroupsData = await this.ptDataService.get<PTGroupDto>(PTEntity.GROUP);

		const ptCreateUser = this.ptRateLimitService.throttle(this.ptUsersApiService.createUser);
		const ptUpdateUserProjects = this.ptRateLimitService.throttle(this.ptUsersApiService.updateUserProjects);

		this.logger.progress.setTotal(trUsersData.length + 1);
		this.logger.progress.setProgress(0);
		this.logger.progress.setBarVisible(true);

		const fallbackUser = ptUsersData.find(
			({ attributes: ptUser }) => ptUser.attributes.email === this.fallbackUserEmail,
		);

		if (fallbackUser) {
			await this.migrationDataService.updateById(this.migrationId, {
				fallbackUserId: Number(fallbackUser.id),
			});

			const fbProjects = await this.getFallbackUserProjects(fallbackUser.attributes, ptUserGroupsData);
			await ptUpdateUserProjects(Number(fallbackUser.id), {
				projects: fbProjects,
			});
		} else if (this.fallbackUserEmail) {
			const { data: createdPtFallbackUser } = await ptCreateUser({
				attributes: {
					email: this.fallbackUserEmail,
					displayName: 'Fallback User',
				},
			});
			await this.ptDataService.save(this.destinationProjectId, PTEntity.USER, [{ ...createdPtFallbackUser }]);
			await this.migrationDataService.updateById(this.migrationId, {
				fallbackUserId: Number(createdPtFallbackUser.id),
			});

			const fbProjects = await this.getFallbackUserProjects(createdPtFallbackUser, ptUserGroupsData);
			await ptUpdateUserProjects(Number(createdPtFallbackUser.id), {
				projects: fbProjects,
			});
		}

		this.statisticsService.increaseProcessedEntitiesCount(this.type, MigrationEntityStepStage.PUSHING, 'tr_user', 1);
		this.logger.progress.addProgress(1);

		for (const trUserData of trUsersData) {
			const trUserMigrationData = trUserData.migrationData as TRUserMigrationData;

			try {
				switch (trUserData.migrationAction) {
					case MigrationAction.INSERT: {
						if (trUserMigrationData.isNew && trUserData.ptEntityId) {
							if (trUserMigrationData.projects && trUserMigrationData.projects.length > 0) {
								await ptUpdateUserProjects(trUserData.ptEntityId, {
									projects: trUserMigrationData.projects ?? [],
								});
							}

							await this.trDataService.update([
								{
									...trUserData,
									migrationStatus: EntityMigrationStatus.MIGRATED,
								},
							]);
							break;
						}

						await this.trDataService.update([
							{
								...trUserData,
								migrationStatus: EntityMigrationStatus.PENDING,
							},
						]);
						const { data: createdPtUser } = await ptCreateUser({
							attributes: {
								email: trUserData.attributes.email,
								displayName: trUserData.attributes.name,
							},
						});

						await this.ptDataService.save(this.destinationProjectId, PTEntity.USER, [{ ...createdPtUser }]);
						await this.trDataService.update([
							{
								...trUserData,
								migrationStatus: EntityMigrationStatus.PENDING,
								migrationData: { ...trUserMigrationData, isNew: true },
								migrationAction: MigrationAction.UPDATE,
								ptEntityId: createdPtUser.id,
							},
						]);

						if (trUserMigrationData.projects && trUserMigrationData.projects.length > 0) {
							await ptUpdateUserProjects(createdPtUser.id, {
								projects: trUserMigrationData.projects ?? [],
							});
						}

						await this.trDataService.update([
							{
								...trUserData,
								migrationStatus: EntityMigrationStatus.MIGRATED,
								migrationData: { ...trUserMigrationData, isNew: true },
								ptEntityId: createdPtUser.id,
							},
						]);

						break;
					}
					case MigrationAction.UPDATE: {
						if (!trUserData.ptEntityId) {
							break;
						}

						if (trUserMigrationData.projects && trUserMigrationData.projects.length > 0) {
							await ptUpdateUserProjects(trUserData.ptEntityId, { projects: trUserMigrationData.projects ?? [] });
						}

						await this.trDataService.update([
							{
								...trUserData,
								migrationStatus: EntityMigrationStatus.MIGRATED,
							},
						]);

						break;
					}
				}
				this.statisticsService.increaseProcessedEntitiesCount(
					this.type,
					MigrationEntityStepStage.PUSHING,
					'tr_user',
					1,
				);
				this.logger.progress.addProgress(1);
			} catch (error) {
				this.logger.error({ message: `Error during ${trUserData.attributes.email} user migration`, error });
			}
		}
	};

	private readonly handleProjectRoles = (
		trUserData: TRData<TRUserDto>,
		ptUserGroupsData: PTData<PTGroupDto>[],
		ptGroupName: PTDefaultGroupName,
	): TRData<TRUserDto> => {
		const trUserMigrationData = trUserData.migrationData as TRUserMigrationData;

		if (!trUserMigrationData.projects) {
			trUserMigrationData.projects = [];
		}

		const curUserProjectIndex =
			trUserMigrationData.projects.findIndex((project) => project.id === this.destinationProjectId) ?? -1;
		const curUserProject = trUserMigrationData.projects[curUserProjectIndex];

		const userGroupData = ptUserGroupsData.find(
			({ attributes: group }: { attributes: PTGroupDto }) => group.attributes.name === ptGroupName,
		);

		if (!userGroupData) {
			throw new Error(`UserGroup ${ptGroupName} does not exist`);
		}

		const userGroup = userGroupData?.attributes as PTGroupDto;

		// Check if user already has this project
		if (!curUserProject) {
			trUserMigrationData.projects.push({
				id: this.destinationProjectId,
				groups: [{ id: Number(userGroup.id) }],
			});

			return { ...trUserData, migrationData: trUserMigrationData };
		}

		// Check if user already has user group on project
		const hasUserGroup = !!curUserProject.groups.find((group) => group.id === Number(userGroup?.id));

		if (!hasUserGroup) {
			trUserMigrationData.projects[curUserProjectIndex].groups.push({ id: Number(userGroup.id) });

			return { ...trUserData, migrationData: trUserMigrationData };
		}

		return { ...trUserData, migrationData: trUserMigrationData, migrationAction: MigrationAction.IGNORE };
	};

	private readonly getFallbackUserProjects = async (
		fallbackUser: PTUserDto,
		ptUserGroupsData: PTData<PTGroupDto>[],
	): Promise<PTUpdateUserProjectGroups[]> => {
		const ptGroupName = PTDefaultGroupName.ADMINISTRATORS;

		const userProjects = (await this.fetchPTUserProjects(fallbackUser.id)).map((project) => ({
			id: Number(project.id),
			groups: project.attributes.groups.map((group) => ({ id: Number(group.id) })),
		})) as PTUpdateUserProjectGroups[];

		const curUserProjectIndex = userProjects.findIndex((project) => project.id === this.destinationProjectId) ?? -1;
		const curUserProject = userProjects[curUserProjectIndex];

		const userGroupData = ptUserGroupsData.find(
			({ attributes: group }: { attributes: PTGroupDto }) => group.attributes.name === ptGroupName,
		);

		if (!userGroupData) {
			throw new Error(`UserGroup ${ptGroupName} does not exist`);
		}

		const userGroup = userGroupData?.attributes as PTGroupDto;

		// Check if user already has this project
		if (!curUserProject) {
			userProjects.push({
				id: this.destinationProjectId,
				groups: [{ id: Number(userGroup.id) }],
			});

			return userProjects;
		}

		// Check if user already has user group on project
		const hasUserGroup = !!curUserProject.groups.find((group) => group.id === Number(userGroup?.id));

		if (!hasUserGroup) {
			userProjects[curUserProjectIndex].groups.push({ id: Number(userGroup.id) });

			return userProjects;
		}

		return userProjects; // TODO Action ignore
	};

	private readonly fetchPTUsers = async (): Promise<PTData<PTUserDto>[]> => {
		const ptGetUsers = this.ptRateLimitService.throttle(this.ptUsersApiService.getUsers);

		const ptUsersCount = await this.ptDataService.count(PTEntity.USER, this.destinationProjectId);

		const pageSize = 250;

		const savedData: PTData[] = [];

		let nextPage: number | null | undefined = Math.ceil(ptUsersCount / pageSize) + 1;
		while (nextPage) {
			const response = await ptGetUsers({
				pagination: {
					pageNumber: nextPage,
					pageSize,
				},
			});
			savedData.push(...(await this.ptDataService.save(this.destinationProjectId, PTEntity.USER, response.data)));
			this.statisticsService.increaseProcessedEntitiesCount(
				this.type,
				MigrationEntityStepStage.PULLING,
				'pt_user',
				response.data.length,
			);
			nextPage = response?.meta?.nextPage;
		}

		return savedData;
	};

	private readonly fetchTRUsers = async (): Promise<TRData<TRUserDto>[]> => {
		const trGetUsersByProjectId = this.trRateLimitService.throttle(this.trUsersApiService.getUsersByProjectId);

		const trUsersCount = await this.trDataService.count(TREntity.USER, this.sourceProjectId);

		const limit = 250;
		let page = Math.ceil(trUsersCount / limit);
		let next: string | null | undefined;
		const savedData: TRData<TRUserDto>[] = [];

		do {
			const response = await trGetUsersByProjectId(this.sourceProjectId, IS_TESTRAIL_CLOUD_INSTANCE ? {
				pagination: {
					limit,
					offset: limit * page,
				},
			} : undefined);
			savedData.push(...(await this.trDataService.save(this.sourceProjectId, TREntity.USER, response.users)));
			this.statisticsService.increaseProcessedEntitiesCount(
				this.type,
				MigrationEntityStepStage.PULLING,
				'tr_user',
				response?.users?.length,
			);

			next = response?._links?.next;
			page++;
			// eslint-disable-next-line no-unmodified-loop-condition
		} while (IS_TESTRAIL_CLOUD_INSTANCE && next);

		return savedData;
	};

	private readonly fetchPTUserGroups = async (): Promise<PTData<PTGroupDto>[]> => {
		const getGroupsByProjectId = this.ptRateLimitService.throttle(this.ptGroupsApiService.getGroupsByProjectId);
		const ptGroupsCount = await this.ptDataService.count(PTEntity.GROUP, this.destinationProjectId);
		const pageSize = 250;

		const savedData: PTData<PTGroupDto>[] = [];

		let nextPage: number | null | undefined = Math.ceil(ptGroupsCount / pageSize) + 1;
		while (nextPage) {
			const response = await getGroupsByProjectId(this.destinationProjectId, {
				pagination: {
					pageNumber: nextPage,
					pageSize,
				},
			});
			savedData.push(...(await this.ptDataService.save(this.destinationProjectId, PTEntity.GROUP, response.data)));
			this.statisticsService.increaseProcessedEntitiesCount(
				this.type,
				MigrationEntityStepStage.PULLING,
				'pt_group',
				response.data.length,
			);
			nextPage = response?.meta?.nextPage;
		}

		return savedData;
	};

	private readonly fetchPTUserProjects = async (userId: string): Promise<PTUserProjectDto[]> => {
		const getUserProjects = this.ptRateLimitService.throttle(this.ptUsersApiService.getUserProjects);

		const savedData: PTUserProjectDto[] = [];

		let nextPage: number | null | undefined = 1;
		while (nextPage) {
			const userProjectsResponse = await getUserProjects(userId, {
				pagination: {
					pageNumber: nextPage,
					pageSize: 250,
				},
			});
			savedData.push(...userProjectsResponse.data);
			nextPage = userProjectsResponse?.meta?.nextPage;
		}

		return savedData;
	};
}
