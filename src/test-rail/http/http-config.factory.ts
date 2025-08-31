import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';
import { IAppConfig } from 'src/core/types/app.config';

export const trAxiosConfigFactory = (configService: ConfigService<IAppConfig>): AxiosRequestConfig => ({
	baseURL: configService.get('TESTRAIL_BASE_URL') + '/index.php?/api/v2/',
	headers: {
		'Content-Type': 'application/json',
	},
	auth: {
		username: configService.get('TESTRAIL_USERNAME') ?? '',
		password: configService.get('TESTRAIL_API_KEY') ?? '',
	},
	timeout: 120000,
	maxRedirects: 5,
});
