import { ChatCompletionRequest } from './body';
import { EasyLLMProps } from './main';
import { Callbacks } from './message';
import { AddToolProps } from './tool';

type PartialLLM = Partial<Callbacks>;

export type useEasyLLMProps = {
  systemPrompt?: string;
  tools?: AddToolProps[];
} & EasyLLMProps &
  PartialLLM;

export type WithTime<T> = { timestamp: number } & T;

export type SendFunctionProps = {
  message: { role: ChatRole; content: string };
} & Omit<ChatCompletionRequest, 'messages'>;
