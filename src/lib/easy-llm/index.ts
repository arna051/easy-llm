import axios from 'axios';
import {
  AddToolProps,
  EasyLLMProps,
  FunctionAny,
  LLMToolSchema,
  OtherProps,
  Callbacks,
  OnErrorCallback,
  OnResponseCallCallback,
  SendProps,
  OnLoadingCallback,
  OnToolErrorCallback,
  OnToolResultCallback,
  OnToolCallingCallback,
  FunctionRecord,
} from '../../types';
import { SendRequest, toolRegister } from './utils';

export function EasyLLM({
  url = 'https://api.deepseek.com/chat/completions',
  apiKey,
  betweenRequestDelay = 0,
  retries = 3,
  retryDelay = 1e3,
  timeoutMS = 1e3 * 60 * 3,
}: EasyLLMProps) {
  const https = axios.create({
    baseURL: url,
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    timeout: timeoutMS,
  });

  const tools: LLMToolSchema[] = [];
  const functions: Record<string, FunctionRecord> = {};

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
    send: (body: SendProps) => {
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
