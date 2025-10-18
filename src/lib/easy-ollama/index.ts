import axios from 'axios';
import {
  AddToolProps,
  FunctionAny,
  LLMToolSchema,
  OnToolCallCallback,
  OnResponseCallCallback,
  OnErrorCallback,
} from '../../types';
import { EasyOllamaProps, OllamaCallbacks, OllamaSendProps } from '../../types/ollama';
import { sendRequest } from './send';
import { toolRegister } from '../easy-llm/utils';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434/api/chat';

export function EasyOllama({ url = DEFAULT_OLLAMA_URL, headers }: EasyOllamaProps = {}) {
  const https = axios.create({
    baseURL: url,
    headers,
    timeout: 1e3 * 60 * 10,
  });

  const tools: LLMToolSchema[] = [];
  const functions: Record<string, FunctionAny> = {};

  const callbacks: OllamaCallbacks = {
    tool: () => null,
    message: () => null,
    error: () => null,
  };

  const others = { signal: new AbortController() };

  const returnObject = {
    tool(tool: AddToolProps) {
      toolRegister({ tools, functions, tool });
      return returnObject;
    },
    onCall(callback: OnToolCallCallback) {
      callbacks.tool = callback;
      return returnObject;
    },
    onMessage(callback: OnResponseCallCallback) {
      callbacks.message = callback;
      return returnObject;
    },
    onError(callback: OnErrorCallback) {
      callbacks.error = callback;
      return returnObject;
    },
    send(body: OllamaSendProps) {
      sendRequest({
        axios: https,
        callbacks,
        body,
        others,
        tools,
        functions,
      });
      return returnObject;
    },
    abort() {
      others.signal.abort();
      others.signal = new AbortController();
      return returnObject;
    },
  };

  return returnObject;
}
