import { AxiosResponse } from 'axios';
import { Readable } from 'stream';
import { ChatMessage, FunctionAny, LLMToolSchema } from '../../types';
import { OllamaSendFunction } from '../../types/ollama';

const TOOL_CALL_PROMPT_HEADER =
  'When you need to use a tool, respond ONLY with valid JSON following this schema:';

type ToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
  raw: string;
};

type ToolCallDetection = {
  call: ToolCall;
  prefix: string;
  suffix: string;
};

export const sendRequest: OllamaSendFunction = async ({
  axios,
  callbacks,
  body,
  others,
  tools,
  functions,
}) => {
  try {
    const { messages: inputMessages, ...rest } = body;
    const llmMessages = preparePromptMessages(inputMessages, tools);

    while (true) {
      const controller = new AbortController();
      others.signal = controller;

      const payload = {
        ...rest,
        messages: llmMessages,
        stream: true as const,
      };

      const { data } = await axios.post<typeof payload, AxiosResponse<Readable>>('', payload, {
        signal: controller.signal,
        responseType: 'stream',
      });

      const { content } = await collectStreamContent(data);
      const toolDetection = detectToolCall(content);

      if (toolDetection) {
        const assistantToolMessage = normalizeChatMessage({
          role: 'assistant',
          content: toolDetection.call.raw,
        });

        body.messages.push(assistantToolMessage);
        llmMessages.push(assistantToolMessage);

        callbacks.tool({
          role: 'tool',
          tool_call_id: toolDetection.call.id,
          content: `Calling tool "${toolDetection.call.name}"`,
        });

        const toolResult = await executeTool(
          functions,
          toolDetection.call.name,
          toolDetection.call.args,
        );

        const toolMessage: ChatMessage = {
          role: 'tool',
          content: toolResult,
          tool_call_id: toolDetection.call.id,
        };

        body.messages.push(toolMessage);
        llmMessages.push(toolMessage);
        continue;
      }

      const visibleContent = sanitizeAssistantContent(content);
      if (visibleContent.length === 0) {
        continue;
      }

      const finalMessage = normalizeChatMessage({
        role: 'assistant',
        content: visibleContent,
      });

      body.messages.push(finalMessage);
      llmMessages.push(finalMessage);

      callbacks.message({
        role: 'assistant',
        content: finalMessage.content,
      });
      break;
    }
  } catch (error) {
    callbacks.error(error as Error);
  }
};

function preparePromptMessages(messages: ChatMessage[], tools: LLMToolSchema[]): ChatMessage[] {
  const prepared = messages.map(normalizeChatMessage);

  if (!tools.length) return prepared;

  const toolInstruction = buildToolInstruction(tools);
  prepared.unshift({
    role: 'system',
    content: toolInstruction,
  });

  return prepared;
}

function normalizeChatMessage(message: Partial<ChatMessage>): ChatMessage {
  const content = normalizeContent(message?.content);
  const normalized: ChatMessage = {
    role: (message?.role ?? 'user') as ChatMessage['role'],
    content,
  };

  if (message?.tool_call_id) {
    normalized.tool_call_id = message.tool_call_id;
  }

  return normalized;
}

function normalizeContent(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function detectToolCall(content: string): ToolCallDetection | null {
  if (!content) return null;

  let startIndex = content.lastIndexOf('{');

  while (startIndex !== -1) {
    const slice = sliceBalancedJson(content, startIndex);
    if (!slice) {
      startIndex = content.lastIndexOf('{', startIndex - 1);
      continue;
    }

    const rawJson = slice.json.trim();

    try {
      const payload = JSON.parse(rawJson);
      const call = toToolCall(payload, rawJson);
      if (call) {
        return {
          call,
          prefix: content.slice(0, startIndex),
          suffix: content.slice(slice.endIndex + 1),
        };
      }
    } catch {
      // keep searching
    }

    startIndex = content.lastIndexOf('{', startIndex - 1);
  }

  return null;
}

function createToolCallId(name: string): string {
  return `ollama-tool-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function executeTool(
  functions: Record<string, FunctionAny>,
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const tool = functions[name];

  if (!tool) {
    throw new Error(`Tool "${name}" is not registered.`);
  }

  const result = await tool(args ?? {});
  return normalizeContent(result);
}

function normalizeArguments(value: unknown): Record<string, unknown> {
  if (value == null) return {};

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { value };
    }

    return { value };
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return { value };
}

function buildToolInstruction(tools: LLMToolSchema[]): string {
  const definitions = tools.map((tool) => {
    const parameters = tool.function?.parameters
      ? JSON.stringify(tool.function.parameters, null, 2)
      : '{}';

    return `- ${tool.function.name}: ${tool.function.description ?? 'no description'}\n  parameters: ${parameters}`;
  });

  return [
    'You can call helper functions to fulfill user requests.',
    `${TOOL_CALL_PROMPT_HEADER} {"tool": {"name": "function_name", "arguments": { ... }}}`,
    'After receiving the tool response (sent as a message with role "tool"), provide the final answer to the user.',
    'Available tools:',
    ...definitions,
  ].join('\n');
}

async function collectStreamContent(stream: Readable): Promise<{ content: string }> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    let aggregated = '';
    let resolved = false;

    const cleanup = () => {
      stream.removeListener('data', onData);
      stream.removeListener('end', onEnd);
      stream.removeListener('close', onEnd);
      stream.removeListener('error', onError);
    };

    const onEnd = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve({ content: aggregated });
    };

    const onError = (error: Error) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(error);
    };

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString();

      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const raw = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (raw.length === 0) {
          newlineIndex = buffer.indexOf('\n');
          continue;
        }

        let parsed: any;
        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          onError(err as Error);
          return;
        }

        if (parsed?.message?.content) {
          aggregated += parsed.message.content;
        }

        if (parsed?.done) {
          onEnd();
          return;
        }

        newlineIndex = buffer.indexOf('\n');
      }
    };

    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('close', onEnd);
    stream.on('error', onError);
  });
}

function sanitizeAssistantContent(content: string): string {
  const withoutReasoning = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const trimmed = withoutReasoning.trim();
  const detection = detectToolCall(trimmed);
  if (detection) {
    const suffix = detection.suffix.trim();
    return suffix.length > 0 ? suffix : '';
  }
  return trimmed;
}

function sliceBalancedJson(
  content: string,
  startIndex: number,
): { json: string; endIndex: number } | null {
  let depth = 0;
  let inString = false;

  for (let index = startIndex; index < content.length; index++) {
    const char = content[index];

    if (char === '"' && content[index - 1] !== '\\') {
      inString = !inString;
    }

    if (inString) continue;

    if (char === '{') depth++;
    if (char === '}') depth--;

    if (depth === 0) {
      return {
        json: content.slice(startIndex, index + 1),
        endIndex: index,
      };
    }
  }

  return null;
}

function toToolCall(payload: any, raw: string): ToolCall | null {
  if (!payload || typeof payload !== 'object') return null;

  if (typeof payload.tool === 'string') {
    return {
      id: createToolCallId(payload.tool),
      name: payload.tool,
      args: normalizeArguments(payload.arguments),
      raw,
    };
  }

  if (payload.tool && typeof payload.tool === 'object') {
    const name = typeof payload.tool.name === 'string' ? payload.tool.name : undefined;
    if (!name) return null;
    const args = payload.tool.arguments ?? payload.arguments;
    return {
      id: createToolCallId(name),
      name,
      args: normalizeArguments(args),
      raw,
    };
  }

  if (payload.function_call && typeof payload.function_call === 'object') {
    const name =
      typeof payload.function_call.name === 'string' ? payload.function_call.name : undefined;
    if (!name) return null;
    const args = payload.function_call.arguments ?? payload.arguments;
    return {
      id: createToolCallId(name),
      name,
      args: normalizeArguments(args),
      raw,
    };
  }

  return null;
}
