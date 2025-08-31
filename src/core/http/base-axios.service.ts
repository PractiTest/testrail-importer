import { IncomingMessage } from 'http';
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosRequestConfig, AxiosError, AxiosInstance } from 'axios';
import axiosRetry, { isNetworkOrIdempotentRequestError } from 'axios-retry';
import { LoggingService } from 'src/core/logging/logging.service';
import { Readable } from 'stream';
import { streamToPromise } from '../utils/api.utils';
import { CRITICAL_STATUS_CODES } from 'src/core/config/configuration';

export class BaseAxiosService {
	constructor(
		protected readonly loggingService: LoggingService,
		private readonly axiosConfig: AxiosRequestConfig,
		private readonly axiosInstance = axios.create(axiosConfig),
	) {
		// super(axiosConfig);

		this.axiosRef.interceptors.request.use(this.logRequestInterceptor);
		this.axiosRef.interceptors.response.use(this.logResponseInterceptor, this.logResponseErrorInterceptor);

		// createInterceptor(this as unknown as AxiosInstance, globalConfig);

		axiosRetry(this.axiosRef, {
			retries: 7,
			retryDelay: (retryCount: number, error) => {
				// const status = error.response?.status ?? -1;
				// const timeoutSeconds = status === 429 ? 60 : 2 ^ retryCount;
				const timeoutSeconds = Math.pow(2, retryCount);

				loggingService.warn({ message: `Retry attempt #${retryCount} in ${timeoutSeconds} seconds` });

				return timeoutSeconds * 1000;
			}, // time interval between retries
			retryCondition: (error) => {
				const status = error.response?.status ?? -1;

				return isNetworkOrIdempotentRequestError(error) || status === 429 || (status >= 500 && status <= 599);
			},
		});
	}

	public get axiosRef(): AxiosInstance {
		return this.axiosInstance;
	}

	private readonly getFormattedUri = (config: InternalAxiosRequestConfig): string => {
		const urlWithParams = new URL(this.axiosRef.getUri() + (config.url ?? ''));
		const queryParams = new URLSearchParams(config.params);

		for (const [key, value] of queryParams.entries()) {
			urlWithParams.searchParams.set(key, value);
		}

		return urlWithParams.toString();
	};

	private readonly logRequestInterceptor = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
		const fullUrl = this.getFormattedUri(config);

		this.loggingService.verbose({
			message: `Sending ${config.method?.toUpperCase()} request to ${fullUrl}`,
		});
		this.loggingService.debug({
			message: `Request params`,
			config: {
				queryParams: config.params,
				requestBody: config.data,
			},
		});

		return config;
	};

	private readonly logResponseInterceptor = (response: AxiosResponse): AxiosResponse => {
		const fullUrl = this.getFormattedUri(response.config);

		this.loggingService.verbose({
			message: `Request ${response.config.method?.toUpperCase()} ${fullUrl} completed with status ${response.status}`,
		});
		this.loggingService.debug({
			message: `Request params`,
			config: {
				queryParams: response.config.params,
				requestBody: response.config.data,
			},
		});
		this.loggingService.debug({
			message: `Response body`,
			response: {
				data: response.data,
			},
		});

		return response;
	};

	private readonly logResponseErrorInterceptor = async (error: AxiosError): Promise<AxiosError> => {
		this.loggingService.error({ message: error.message });

		if (error.response?.data instanceof Readable || error.response?.data instanceof IncomingMessage) {
			const dataString = await streamToPromise(error.response.data);
			this.loggingService.verbose({ message: 'Error response', data: JSON.parse(dataString) });
		} else if (error.response?.data instanceof Uint8Array) {
			const decoder = new TextDecoder('utf-8');
			this.loggingService.verbose({ message: 'Error response', data: JSON.parse(decoder.decode(error.response.data)) });
		} else {
			this.loggingService.verbose({ message: 'Error response', data: error.response?.data });
		}

		const errorStatus = Number(error.response?.status);

		if (CRITICAL_STATUS_CODES.includes(errorStatus)) {
			this.loggingService.error({ message: `Critical response status code: ${errorStatus}. Exiting...` });
			process.exit();
		}

		return Promise.reject(error);
	};
}
