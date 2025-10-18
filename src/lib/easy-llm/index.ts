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
  OnToolCallCallback,
  SendProps,
} from '../../types';
import { SendRequest, toolRegister } from './utils';

export function EasyLLM({
  url = 'https://api.deepseek.com/chat/completions',
  apiKey,
}: EasyLLMProps) {
  const https = axios.create({
    baseURL: url,
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    timeout: 1e3 * 60 * 10,
  });

  const tools: LLMToolSchema[] = [];
  const functions: Record<string, FunctionAny> = {};

  const callbacks: Callbacks = {
    tool: () => null,
    message: () => null,
    error: () => null,
  };

  const others: OtherProps = {
    signal: new AbortController(),
  };

  const returnObject = {
    tool: (tool: AddToolProps) => {
      toolRegister({ tools, functions, tool });
      return returnObject;
    },
    onCall: (callback: OnToolCallCallback) => {
      callbacks.tool = callback;
      return returnObject;
    },
    onMessage: (callback: OnResponseCallCallback) => {
      callbacks.message = callback;
      return returnObject;
    },
    onError: (callback: OnErrorCallback) => {
      callbacks.error = callback;
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
      });
      return returnObject;
    },
    abort: () => {
      others.signal.abort();
    },
  };

  return returnObject;
}
