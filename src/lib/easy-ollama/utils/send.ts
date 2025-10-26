import { AxiosInstance, AxiosResponse } from 'axios';
import {
  OllamaChatMessage,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaSendFunction,
  OllamaSendFunctionProps,
} from '../../../types';

async function postWithRetry(
  axios: AxiosInstance,
  body: OllamaChatRequest,
  controller: AbortController,
  retries: number,
  retryDelay: number,
) {
  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.post<
        OllamaChatRequest,
        AxiosResponse<OllamaChatResponse>
      >('', body, { signal: controller.signal });

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, retryDelay));
      }
    }
  }

  throw lastError;
}

export const SendRequest: OllamaSendFunction = async ({
  callbacks,
  functions,
  others,
  tools,
  axios,
  body,
  betweenRequestDelay,
  retries,
  retryDelay,
}: OllamaSendFunctionProps) => {
  try {
    let shouldContinue = true;

    if (tools.length) {
      body.tools = tools;
    } else if (body.tools === undefined) {
      body.tools = null;
    }

    if (body.stream === undefined) {
      body.stream = false;
    }

    callbacks.onStateChange(true);

    while (shouldContinue) {
      const controller = new AbortController();
      others.signal = controller;

      const { data } = await postWithRetry(axios, body, controller, retries, retryDelay);

      const message = normalizeOllamaMessage(data.message);

      body.messages.push(stripForHistory(message));

      const { tool_calls } = message;

      if (tool_calls?.length) {
        callbacks.onMessage(message as any);

        for (let index = 0; index < tool_calls.length; index++) {
          const toolCall = tool_calls[index];
          const toolCallId = toolCall.id ?? toolCall.function.name;
          const parsedArguments = toolCall.function.arguments;

          callbacks.onToolCall(toolCallId, toolCall.function.name, parsedArguments);

          try {
            const { func, type } = functions[toolCall.function.name]
            const content = await func(
              toolCall.function.arguments as any,
            );
            if (!type || type === 'auto') {
              callbacks.onToolResult(toolCallId, toolCall.function.name, content);

              body.messages.push({
                role: 'tool',
                tool_call_id: toolCallId,
                content: stringifyToolContent(content),
              });

              callbacks.onMessage({
                role: 'tool',
                tool_call_id: toolCallId,
                content: stringifyToolContent(content),
              })
            } else {
              shouldContinue = false;
            }
          } catch (err) {
            callbacks.onToolError(toolCallId, toolCall.function.name, err);

            body.messages.push({
              role: 'tool',
              tool_call_id: toolCallId,
              content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
            });
          }
        }

        if (betweenRequestDelay) {
          await new Promise((res) => setTimeout(res, betweenRequestDelay));
        }

        if (shouldContinue)
          continue;
      }

      callbacks.onMessage(message as any);
      shouldContinue = false;
    }
  } catch (err: any) {
    callbacks.onError(err);
  } finally {
    callbacks.onStateChange(false);
  }
};

function parseArguments(args: any) {
  if (args && typeof args === 'object') return args as Record<string, any>;

  if (typeof args === 'string') {
    try {
      return JSON.parse(args);
    } catch {
      return { value: args };
    }
  }

  return {};
}

function stringifyToolContent(content: any) {
  if (typeof content === 'string') return content;
  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}

function normalizeOllamaMessage(message: OllamaChatMessage): OllamaChatMessage {
  const normalized: OllamaChatMessage = {
    ...message,
    content: message.content ?? '',
  };

  if (message.tool_calls?.length) {
    normalized.tool_calls = message.tool_calls.map((toolCall, index) => {
      const parsedArguments = parseArguments(toolCall.function.arguments);
      return {
        id: toolCall.id ?? `tool_call_${index}`,
        type: 'function',
        function: {
          ...toolCall.function,
          arguments: parsedArguments,
        },
      };
    });
  }

  if (message.tool_call_id) normalized.tool_call_id = message.tool_call_id;
  if (message.name) normalized.name = message.name;
  if (message.images?.length) normalized.images = [...message.images];
  if (message.reasoning_content) normalized.reasoning_content = message.reasoning_content;

  return normalized;
}

function stripForHistory(message: OllamaChatMessage): OllamaChatMessage {
  const history: OllamaChatMessage = {
    role: message.role,
    content: message.content,
  };

  if (message.tool_calls?.length) {
    history.tool_calls = message.tool_calls.map((toolCall, index) => ({
      id: toolCall.id ?? `tool_call_${index}`,
      type: 'function',
      function: {
        ...toolCall.function,
        arguments: toolCall.function.arguments,
      },
    }));
  }

  if (message.tool_call_id) history.tool_call_id = message.tool_call_id;
  if (message.name) history.name = message.name;
  if (message.images?.length) history.images = [...message.images];
  if (message.reasoning_content) history.reasoning_content = message.reasoning_content;

  return history;
}
