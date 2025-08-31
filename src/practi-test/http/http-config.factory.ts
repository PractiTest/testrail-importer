import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';
import { IAppConfig } from 'src/core/types/app.config';

export const ptAxiosConfigFactory = (configService: ConfigService<IAppConfig>): AxiosRequestConfig => ({
	baseURL: configService.get('PRACTITEST_BASE_URL') + '/api/v2/',
	auth: {
		username: configService.get('PRACTITEST_USERNAME') ?? '',
		password: configService.get('PRACTITEST_API_KEY') ?? '',
	},
	timeout: 120000,
	maxRedirects: 5,
});
