'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.sendRequest = void 0;
const TOOL_CALL_PROMPT_HEADER =
  'When you need to use a tool, respond ONLY with valid JSON following this schema:';
const MAX_ITERATIONS = 6;
const sendRequest = async ({ axios, callbacks, body, others, tools, functions }) => {
  try {
    const { messages: inputMessages, ...rest } = body;
    const llmMessages = preparePromptMessages(inputMessages, tools);
    const executedTools = new Map();
    let lastTool = null;
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const controller = new AbortController();
      others.signal = controller;
      const payload = {
        ...rest,
        messages: llmMessages,
        stream: true,
      };
      const { data } = await axios.post('', payload, {
        signal: controller.signal,
        responseType: 'stream',
      });
      const { content } = await collectStreamContent(data);
      const toolDetection = detectToolCall(content);
      if (toolDetection) {
        const callKey = createToolCallKey(toolDetection.call);
        if (executedTools.has(callKey)) {
          const fallbackContent = buildFallbackMessage(
            toolDetection.call.name,
            executedTools.get(callKey),
          );
          const fallbackMessage = normalizeChatMessage({
            role: 'assistant',
            content: fallbackContent,
          });
          body.messages.push(fallbackMessage);
          llmMessages.push(fallbackMessage);
          callbacks.message({
            role: 'assistant',
            content: fallbackMessage.content,
          });
          return;
        }
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
        const toolMessage = {
          role: 'tool',
          content: toolResult,
          tool_call_id: toolDetection.call.id,
        };
        body.messages.push(toolMessage);
        llmMessages.push(toolMessage);
        executedTools.set(callKey, toolResult);
        lastTool = { name: toolDetection.call.name, result: toolResult };
        llmMessages.push({
          role: 'system',
          content: buildToolFollowupInstruction(toolDetection.call.name, toolResult),
        });
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
      return;
    }
    if (lastTool) {
      const fallbackMessage = normalizeChatMessage({
        role: 'assistant',
        content: buildFallbackMessage(lastTool.name, lastTool.result),
      });
      body.messages.push(fallbackMessage);
      callbacks.message({
        role: 'assistant',
        content: fallbackMessage.content,
      });
      return;
    }
    throw new Error('Ollama response did not produce a usable message.');
  } catch (error) {
    callbacks.error(error);
  }
};
exports.sendRequest = sendRequest;
function preparePromptMessages(messages, tools) {
  const prepared = messages.map(normalizeChatMessage);
  if (!tools.length) return prepared;
  const toolInstruction = buildToolInstruction(tools);
  prepared.unshift({
    role: 'system',
    content: toolInstruction,
  });
  return prepared;
}
function normalizeChatMessage(message) {
  const content = normalizeContent(message?.content);
  const normalized = {
    role: message?.role ?? 'user',
    content,
  };
  if (message?.tool_call_id) {
    normalized.tool_call_id = message.tool_call_id;
  }
  return normalized;
}
function normalizeContent(value) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
function detectToolCall(content) {
  if (!content) return null;
  const trimmed = content.trim();
  const directCall = parseToolCall(trimmed);
  if (directCall) {
    return {
      call: directCall,
      prefix: '',
      suffix: '',
    };
  }
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
function parseToolCall(candidate) {
  if (!candidate.startsWith('{') || !candidate.endsWith('}')) return null;
  try {
    const payload = JSON.parse(candidate);
    return toToolCall(payload, candidate);
  } catch {
    return null;
  }
}
function createToolCallId(name) {
  return `ollama-tool-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function createToolCallKey(call) {
  return `${call.name}:${stableStringify(call.args ?? {})}`;
}
async function executeTool(functions, name, args) {
  const tool = functions[name];
  if (!tool) {
    throw new Error(`Tool "${name}" is not registered.`);
  }
  const result = await tool(args ?? {});
  return normalizeContent(result);
}
function normalizeArguments(value) {
  if (value == null) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return { value };
    }
    return { value };
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return { value };
}
function buildToolInstruction(tools) {
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
async function collectStreamContent(stream) {
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
    const onError = (error) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(error);
    };
    const onData = (chunk) => {
      buffer += chunk.toString();
      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const raw = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (raw.length === 0) {
          newlineIndex = buffer.indexOf('\n');
          continue;
        }
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          onError(err);
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
function sanitizeAssistantContent(content) {
  const withoutReasoning = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const trimmed = withoutReasoning.trim();
  const detection = detectToolCall(trimmed);
  if (!detection) return trimmed;
  const suffix = detection.suffix.trim();
  const prefix = detection.prefix.trim();
  if (suffix.length > 0) return suffix;
  if (prefix.length > 0) return prefix;
  return '';
}
function sliceBalancedJson(content, startIndex) {
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
function toToolCall(payload, raw) {
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
function buildToolFollowupInstruction(name, result) {
  const safeResult = truncateForInstruction(result.trim());
  return [
    `The tool "${name}" returned the following output: ${safeResult.length ? safeResult : '[empty response]'}.`,
    'Respond to the user with a clear answer that uses this information and avoid mentioning internal implementation details.',
  ].join(' ');
}
function buildFallbackMessage(name, result) {
  const trimmed = result.trim();
  if (!trimmed.length) {
    return `The tool "${name}" did not return any data.`;
  }
  if (/^\s*[{[]/.test(trimmed)) {
    return `${name} -> ${trimmed}`;
  }
  return trimmed;
}
function truncateForInstruction(value, limit = 200) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}…`;
}
function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const entries = Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`);
  return `{${entries.join(',')}}`;
}
