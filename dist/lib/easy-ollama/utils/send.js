"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendRequest = void 0;
async function postWithRetry(axios, body, controller, retries, retryDelay) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await axios.post('', body, { signal: controller.signal });
            return response;
        }
        catch (error) {
            lastError = error;
            if (attempt < retries) {
                await new Promise((res) => setTimeout(res, retryDelay));
            }
        }
    }
    throw lastError;
}
const SendRequest = async ({ callbacks, functions, others, tools, axios, body, betweenRequestDelay, retries, retryDelay, }) => {
    try {
        let shouldContinue = true;
        if (tools.length) {
            body.tools = tools;
        }
        else if (body.tools === undefined) {
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
                callbacks.onMessage(message);
                for (let index = 0; index < tool_calls.length; index++) {
                    const toolCall = tool_calls[index];
                    const toolCallId = toolCall.id ?? toolCall.function.name;
                    const parsedArguments = toolCall.function.arguments;
                    callbacks.onToolCall(toolCallId, toolCall.function.name, parsedArguments);
                    try {
                        const content = await functions[toolCall.function.name](parsedArguments);
                        callbacks.onToolResult(toolCallId, toolCall.function.name, content);
                        body.messages.push({
                            role: 'tool',
                            tool_call_id: toolCallId,
                            content: stringifyToolContent(content),
                        });
                    }
                    catch (err) {
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
                continue;
            }
            callbacks.onMessage(message);
            shouldContinue = false;
        }
    }
    catch (err) {
        callbacks.onError(err);
    }
    finally {
        callbacks.onStateChange(false);
    }
};
exports.SendRequest = SendRequest;
function parseArguments(args) {
    if (args && typeof args === 'object')
        return args;
    if (typeof args === 'string') {
        try {
            return JSON.parse(args);
        }
        catch {
            return { value: args };
        }
    }
    return {};
}
function stringifyToolContent(content) {
    if (typeof content === 'string')
        return content;
    try {
        return JSON.stringify(content);
    }
    catch {
        return String(content);
    }
}
function normalizeOllamaMessage(message) {
    const normalized = {
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
    if (message.tool_call_id)
        normalized.tool_call_id = message.tool_call_id;
    if (message.name)
        normalized.name = message.name;
    if (message.images?.length)
        normalized.images = [...message.images];
    if (message.reasoning_content)
        normalized.reasoning_content = message.reasoning_content;
    return normalized;
}
function stripForHistory(message) {
    const history = {
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
    if (message.tool_call_id)
        history.tool_call_id = message.tool_call_id;
    if (message.name)
        history.name = message.name;
    if (message.images?.length)
        history.images = [...message.images];
    if (message.reasoning_content)
        history.reasoning_content = message.reasoning_content;
    return history;
}
