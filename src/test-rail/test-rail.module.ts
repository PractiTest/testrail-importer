import { Module } from '@nestjs/common';
import { LoggingModule } from '../core/logging/logging.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import * as trApiServices from 'src/test-rail/data-services';
import { trAxiosConfigFactory } from 'src/test-rail/http/http-config.factory';
import { TRApiService } from 'src/test-rail/http/tr-api.service';
import { TRRateLimitService } from 'src/test-rail/http/tr-rate-limit.service';

/**
 * This module should contain all the code related to integration with test rail. Models, Http interaction, etc.
 */

const apiServices = [
	trApiServices.TRAttachmentsApiService,
	trApiServices.TRCasesApiService,
	trApiServices.TRPlansApiService,
	trApiServices.TRProjectsApiService,
	trApiServices.TRResultsApiService,
	trApiServices.TRRunsApiService,
	trApiServices.TRSectionsApiService,
	trApiServices.TRTemplatesApiService,
	trApiServices.TRTestsApiService,
	trApiServices.TRUsersApiService,
	trApiServices.TRSharedStepsApiService,
	trApiServices.TRSuitesApiService
];
@Module({
	imports: [
		LoggingModule,
		ConfigModule,
		HttpModule.registerAsync({
			imports: [ConfigModule],
			useFactory: trAxiosConfigFactory,
			inject: [ConfigService],
		}),
	],
	providers: [TRApiService, ...apiServices, TRRateLimitService],
	exports: [...apiServices, TRRateLimitService],
})
export class TestRailModule {}
