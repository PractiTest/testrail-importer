import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RateLimitService } from 'src/core/http/rate-limit.service';
import { IAppConfig } from 'src/core/types/app.config';

@Injectable()
export class TRRateLimitService extends RateLimitService {
	constructor(configService: ConfigService<IAppConfig>) {
		super(+configService.get('TESTRAIL_API_LIMIT', 250));
	}
}
