import { AxiosResponse } from "axios";
import { ChatCompletionMessage, ChatCompletionRequest, ChatCompletionResponse, ChatMessage, SendFunction } from "../../../types";

export const SendRequest: SendFunction = async ({ callbacks, functions, others, tools, axios, body }) => {
    try {
        let status = true;

        body.tools = tools;


        while (status) {

            const controller = new AbortController();

            others.signal = controller;

            const { data } = await axios.post<ChatCompletionRequest, AxiosResponse<ChatCompletionResponse>>("", body, { signal: controller.signal });


            const message = data.choices[0].message

            const { tool_calls } = message;

            body.messages.push(normalizeChatMessage(message as any));


            if (tool_calls?.length) {
                callbacks.tool(message as any)

                for (let index = 0; index < tool_calls.length; index++) {
                    const tool_call = tool_calls[index];

                    tool_call.function.arguments = parseArguments(tool_call.function.arguments);

                    body.messages.push({
                        role: 'tool',
                        tool_call_id: tool_call.id,
                        content: await functions[tool_call.function.name](tool_call.function.arguments as any)
                    });


                }
                // console.dir(body.messages, { depth: 1000 }); // debug
                continue;
            }

            callbacks.message(message as any)
            status = false;
        }
    }
    catch (err: any) {
        callbacks.error(err)
    }
}


function parseArguments(args: any) {
    if (typeof args === 'object') return args;

    try {
        return JSON.parse(args);
    }
    catch {
        return args
    }
}

export function normalizeChatMessage(msg: ChatMessage & ChatCompletionMessage): ChatMessage & ChatCompletionMessage {
    const safeMessage: ChatMessage & ChatCompletionMessage = {
        role: msg.role,
        content:
            msg.content === undefined
                ? ""
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
                arguments:
                    typeof call.function.arguments === 'string'
                        ? call.function.arguments
                        : JSON.stringify(call.function.arguments ?? {}),
            },
        }));
    }

    return safeMessage;
}