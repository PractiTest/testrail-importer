import { InternalAxiosRequestConfig } from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pThrottle from 'p-throttle';
import { LoggingService } from 'src/core/logging/logging.service';
import { ptAxiosConfigFactory } from 'src/practi-test/http/http-config.factory';
import { BaseAxiosService } from 'src/core/http/base-axios.service';
import { TAnyFunction } from 'src/core/http/general-types';
import { IAppConfig } from 'src/core/types/app.config';

@Injectable()
export class PTApiService extends BaseAxiosService {
	// private readonly throttle = pThrottle({ limit: 2, interval: 30000 });

	private readonly throttle: TAnyFunction;

	constructor(
		protected readonly loggingService: LoggingService,
		configService: ConfigService<IAppConfig>,
	) {
		super(loggingService, ptAxiosConfigFactory(configService));
		const apiLimit: number | null | undefined = +configService.get('PRACTITEST_API_LIMIT');
		this.throttle = pThrottle({ limit: apiLimit ?? 50, interval: 60000 });

		if (apiLimit) {
			this.axiosRef.interceptors.request.use(this.throttleInterceptor);
		}

		this.loggingService.setContext(PTApiService.name);
	}

	private readonly getConfig = async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> =>
		Promise.resolve(config);

	private readonly throttleInterceptor = async (
		config: InternalAxiosRequestConfig,
	): Promise<InternalAxiosRequestConfig> => this.throttle(this.getConfig)(config);
}
