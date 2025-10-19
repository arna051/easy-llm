import { AxiosInstance, AxiosResponse } from 'axios';
import { ChatCompletionResponse } from '../types';
export declare function axiosWithRetry(axios: AxiosInstance, body: any, controller: AbortController, retries?: number, retryDelay?: number): Promise<AxiosResponse<ChatCompletionResponse, any, {}>>;
