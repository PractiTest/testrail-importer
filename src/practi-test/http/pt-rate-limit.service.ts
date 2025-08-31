import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RateLimitService } from 'src/core/http/rate-limit.service';
import { IAppConfig } from 'src/core/types/app.config';

@Injectable()
export class PTRateLimitService extends RateLimitService {
	constructor(configService: ConfigService<IAppConfig>) {
		super(+configService.get('PRACTITEST_API_LIMIT', 50));
	}
}
