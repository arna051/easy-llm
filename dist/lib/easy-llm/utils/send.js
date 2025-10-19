"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendRequest = void 0;
exports.normalizeChatMessage = normalizeChatMessage;
const retry_1 = require("../../../utils/retry");
const SendRequest = async ({ callbacks, functions, others, tools, axios, body, betweenRequestDelay, retries, retryDelay, }) => {
    try {
        let status = true;
        body.tools = tools;
        callbacks.onStateChange(true);
        while (status) {
            const controller = new AbortController();
            others.signal = controller;
            const { data } = await (0, retry_1.axiosWithRetry)(axios, body, controller, retries, retryDelay);
            const message = data.choices[0].message;
            const { tool_calls } = message;
            body.messages.push(normalizeChatMessage(message));
            if (tool_calls?.length) {
                callbacks.onMessage(message);
                for (let index = 0; index < tool_calls.length; index++) {
                    const tool_call = tool_calls[index];
                    tool_call.function.arguments = parseArguments(tool_call.function.arguments);
                    callbacks.onToolCall(tool_call.id, tool_call.function.name, tool_call.function.arguments);
                    try {
                        const content = await functions[tool_call.function.name](tool_call.function.arguments);
                        callbacks.onToolResult(tool_call.id, tool_call.function.name, content);
                        body.messages.push({
                            role: 'tool',
                            tool_call_id: tool_call.id,
                            content,
                        });
                        callbacks.onMessage({
                            role: 'tool',
                            tool_call_id: tool_call.id,
                            content,
                        });
                    }
                    catch (err) {
                        callbacks.onToolError(tool_call.id, tool_call.function.name, err);
                        body.messages.push({
                            role: 'tool',
                            tool_call_id: tool_call.id,
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
            status = false;
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
    if (typeof args === 'object')
        return args;
    try {
        return JSON.parse(args);
    }
    catch {
        return args;
    }
}
function normalizeChatMessage(msg) {
    const safeMessage = {
        role: msg.role,
        content: msg.content === undefined
            ? ''
            : typeof msg.content === 'object'
                ? JSON.stringify(msg.content)
                : msg.content,
    };
    // Copy optional fields if they exist
    if ('tool_call_id' in msg && msg.tool_call_id) {
        safeMessage.tool_call_id = msg.tool_call_id;
    }
    if ('reasoning_content' in msg && msg.reasoning_content) {
        safeMessage.reasoning_content = msg.reasoning_content;
    }
    // Normalize tool calls if present
    if (msg.tool_calls?.length) {
        safeMessage.tool_calls = msg.tool_calls.map((call) => ({
            ...call,
            function: {
                ...call.function,
                // ✅ Always ensure arguments are JSON string
                arguments: typeof call.function.arguments === 'string'
                    ? call.function.arguments
                    : JSON.stringify(call.function.arguments ?? {}),
            },
        }));
    }
    return safeMessage;
}
