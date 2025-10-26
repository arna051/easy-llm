import { ChatCompletionMessage } from '../../types';
import { SendFunctionProps, useEasyLLMProps, WithTime } from '../../types/llm-hook';
import { AxiosError } from 'axios';
export declare function useEasyLLM({ systemPrompt, tools, onError, onMessage, onStateChange, onToolCall, onToolError, onToolResult, ...props }: useEasyLLMProps): {
    errors: {
        errors: WithTime<Error>[];
        axiosErrors: WithTime<AxiosError<unknown, any>>[];
        toolErrors: WithTime<Error & {
            id: string;
            name: string;
        }>[];
    };
    messages: WithTime<ChatCompletionMessage>[];
    loading: boolean;
    send: ({ message, ...props }: SendFunctionProps) => void;
    llm: {
        registerTool: (name: string, tool: Omit<import("../../types").AddToolProps, "name">) => /*elided*/ any;
        onMessage: (callback: import("../../types").OnResponseCallCallback) => /*elided*/ any;
        onError: (callback: import("../../types").OnErrorCallback) => /*elided*/ any;
        onStateChange: (callback: import("../../types").OnLoadingCallback) => /*elided*/ any;
        onToolCall: (callback: import("../../types").OnToolCallingCallback) => /*elided*/ any;
        onToolError: (callback: import("../../types").OnToolErrorCallback) => /*elided*/ any;
        onToolResult: (callback: import("../../types").OnToolResultCallback) => /*elided*/ any;
        send: (body: import("../../types").SendProps) => /*elided*/ any;
        abort: () => void;
    };
    setMessages: import("react").Dispatch<import("react").SetStateAction<WithTime<ChatCompletionMessage>[]>>;
};
