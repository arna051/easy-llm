import axios from 'axios';
import {
  AddToolProps,
  Callbacks,
  EasyOllamaProps,
  FunctionAny,
  LLMToolSchema,
  OllamaSendProps,
  OnErrorCallback,
  OnLoadingCallback,
  OnResponseCallCallback,
  OnToolCallingCallback,
  OnToolErrorCallback,
  OnToolResultCallback,
  OtherProps,
} from '../../types';
import { toolRegister } from '../easy-llm/utils';
import { SendRequest } from './utils';

export function EasyOllama({
  url = 'http://127.0.0.1:11434/api/chat',
  timeoutMS = 1e3 * 60 * 3,
  retries = 3,
  retryDelay = 1e3,
  betweenRequestDelay = 0,
  headers = {},
}: EasyOllamaProps = {}) {
  const https = axios.create({
    baseURL: url,
    headers,
    timeout: timeoutMS,
  });

  const tools: LLMToolSchema[] = [];
  const functions: Record<string, FunctionAny> = {};

  const callbacks: Callbacks = {
    onMessage: () => null,
    onError: () => null,
    onStateChange: () => null,
    onToolCall: () => null,
    onToolError: () => null,
    onToolResult: () => null,
  };

  const others: OtherProps = {
    signal: new AbortController(),
  };

  const returnObject = {
    registerTool: (name: string, tool: Omit<AddToolProps, 'name'>) => {
      toolRegister({ tools, functions, tool: { ...tool, name } });
      return returnObject;
    },
    onMessage: (callback: OnResponseCallCallback) => {
      callbacks.onMessage = callback;
      return returnObject;
    },
    onError: (callback: OnErrorCallback) => {
      callbacks.onError = callback;
      return returnObject;
    },
    onStateChange: (callback: OnLoadingCallback) => {
      callbacks.onStateChange = callback;
      return returnObject;
    },
    onToolCall: (callback: OnToolCallingCallback) => {
      callbacks.onToolCall = callback;
      return returnObject;
    },
    onToolError: (callback: OnToolErrorCallback) => {
      callbacks.onToolError = callback;
      return returnObject;
    },
    onToolResult: (callback: OnToolResultCallback) => {
      callbacks.onToolResult = callback;
      return returnObject;
    },
    send: (body: OllamaSendProps) => {
      SendRequest({
        axios: https,
        callbacks,
        functions,
        others,
        tools,
        body,
        betweenRequestDelay,
        retries,
        retryDelay,
      });
      return returnObject;
    },
    abort: () => {
      others.signal.abort();
    },
  };

  return returnObject;
}
