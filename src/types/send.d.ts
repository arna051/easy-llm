import { AxiosInstance } from 'axios';
import { ChatCompletionRequest } from './body';
import { OtherProps } from './main';
import { Callbacks } from './message';
import { FunctionAny, FunctionRecord, LLMToolSchema } from './tool';

export type SendFunctionProps = {
  others: OtherProps;
  callbacks: Callbacks;
  tools: LLMToolSchema[];
  functions: Record<string, FunctionRecord>;
  axios: AxiosInstance;
  body: ChatCompletionRequest;
  retries: number;
  retryDelay: number;
  betweenRequestDelay: number;
};
export type SendFunction = (props: SendFunctionProps) => Promise<any>;

export type SendProps = Omit<ChatCompletionRequest, 'tools'>;
