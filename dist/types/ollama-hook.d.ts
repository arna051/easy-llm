import { AddToolProps } from './tool';
import { WithTime } from './llm-hook';
import { EasyOllamaProps, OllamaChatMessage, OllamaChatRequest } from './ollama';
import { Callbacks } from './message';

type PartialCallbacks = Partial<Callbacks>;

export type useEasyOllamaProps = {
  systemPrompt?: string;
  tools?: AddToolProps[];
} & EasyOllamaProps &
  PartialCallbacks;

export type OllamaSendFunctionProps = {
  message: OllamaChatMessage;
} & Omit<OllamaChatRequest, 'messages'>;

export type WithOllamaTime<T> = WithTime<T>;
