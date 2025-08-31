import { Module, Provider } from '@nestjs/common';
import { LoggingModule } from '../core/logging/logging.module';
import { ConfigModule } from '@nestjs/config';
import * as ptApiServices from 'src/practi-test/data-services';
import { PTApiService } from 'src/practi-test/http/pt-api.service';
import { PTRateLimitService } from 'src/practi-test/http/pt-rate-limit.service';

/**
 * This module should contain all the code related to integration with test rail. Models, Http interaction, etc.
 */

// const mockApiServices: Provider[] = [
// 	{ provide: ptApiServices.PTAttachmentsApiService, useClass: ptApiServices.PTMockAttachmentsApiService },
// 	{ provide: ptApiServices.PTGroupsApiService, useClass: ptApiServices.PTMockGroupsApiService },
// 	{ provide: ptApiServices.PTInstancesApiService, useClass: ptApiServices.PTMockInstancesApiService },
// 	{ provide: ptApiServices.PTProjectsApiService, useClass: ptApiServices.PTMockProjectsApiService },
// 	{ provide: ptApiServices.PTRunsApiService, useClass: ptApiServices.PTMockRunsApiService },
// 	{ provide: ptApiServices.PTTestsApiService, useClass: ptApiServices.PTMockTestsApiService },
// 	{ provide: ptApiServices.PTTestSetsApiService, useClass: ptApiServices.PTMockTestSetsApiService },
// 	{ provide: ptApiServices.PTUsersApiService, useClass: ptApiServices.PTMockUsersApiService },
// 	{ provide: ptApiServices.PTCustomFieldsApiService, useClass: ptApiServices.PTMockCustomFieldsApiService },
//
// 	/* {
// 		provide: ptApiServices.PTUsersApiService,
// 		useClass: ptApiServices.PTMockUsersApiService,
// 	}, */
// ];

const apiServices: Provider[] = [
	ptApiServices.PTAttachmentsApiService,
	ptApiServices.PTGroupsApiService,
	ptApiServices.PTInstancesApiService,
	ptApiServices.PTProjectsApiService,
	ptApiServices.PTRunsApiService,
	ptApiServices.PTTestsApiService,
	ptApiServices.PTTestSetsApiService,
	ptApiServices.PTUsersApiService,
	ptApiServices.PTCustomFieldsApiService,

	/* {
		provide: ptApiServices.PTUsersApiService,
		useClass: ptApiServices.PTMockUsersApiService,
	}, */
];

@Module({
	imports: [
		LoggingModule,
		ConfigModule,

		/* HttpModule.registerAsync({
			imports: [ConfigModule],
			useFactory: ptAxiosConfigFactory,
			inject: [ConfigService],
		}), */
	],
	providers: [PTApiService, ...apiServices, PTRateLimitService],
	exports: [...apiServices, PTRateLimitService],
})
export class PractiTestModule {}
