import { AxiosInstance, AxiosResponse } from 'axios';
import { ChatCompletionRequest, ChatCompletionResponse } from '../types';

export async function axiosWithRetry(
  axios: AxiosInstance,
  body: any,
  controller: AbortController,
  retries: number = 3,
  retryDelay: number = 1000,
) {
  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.post<
        ChatCompletionRequest,
        AxiosResponse<ChatCompletionResponse>
      >('', body, { signal: controller.signal });
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        console.warn(
          `Request failed (attempt ${attempt + 1} of ${retries}). Retrying in ${retryDelay}ms...`,
        );
        await new Promise((res) => setTimeout(res, retryDelay));
      }
    }
  }

  throw lastError;
}
