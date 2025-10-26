import { AxiosInstance } from 'axios';
import { Callbacks } from './message';
import { EasyLLMProps, OtherProps } from './main';
import { ChatRole } from './res';
import { LLMToolSchema, FunctionAny, FunctionRecord } from './tool';

export interface EasyOllamaProps
  extends Omit<EasyLLMProps, 'apiKey'> {
  url?: string;
  headers?: Record<string, string>;
}

export interface OllamaChatMessage {
  role: ChatRole;
  content: string | null;
  tool_calls?: OllamaToolCall[];
  tool_call_id?: string;
  name?: string;
  images?: string[];
  reasoning_content?: string | null;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  format?: 'json' | 'text' | Record<string, any>;
  options?: Record<string, any>;
  keep_alive?: number | string;
  tools?: LLMToolSchema[] | null;
  tool_choice?: 'auto' | 'none' | string;
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaChatMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export type OllamaSendProps = Omit<OllamaChatRequest, 'tools'>;

export type OllamaSendFunctionProps = {
  others: OtherProps;
  callbacks: Callbacks;
  tools: LLMToolSchema[];
  functions: Record<string, FunctionRecord>;
  axios: AxiosInstance;
  body: OllamaChatRequest;
  retries: number;
  retryDelay: number;
  betweenRequestDelay: number;
};

export type OllamaSendFunction = (props: OllamaSendFunctionProps) => Promise<void>;

export interface OllamaToolCall {
  id?: string;
  type: 'function';
  function: {
    name: string;
    arguments: Record<string, any>;
  };
}
