import { AxiosError } from 'axios';
import { OllamaChatMessage } from '../../types';
import { WithTime } from '../../types/llm-hook';
import { OllamaSendFunctionProps, useEasyOllamaProps } from '../../types/ollama-hook';
export declare function useEasyOllama({ systemPrompt, tools, onError, onMessage, onStateChange, onToolCall, onToolError, onToolResult, ...props }: useEasyOllamaProps): {
    errors: {
        errors: WithTime<Error>[];
        axiosErrors: WithTime<AxiosError<unknown, any>>[];
        toolErrors: WithTime<Error & {
            id: string;
            name: string;
        }>[];
    };
    messages: WithTime<OllamaChatMessage>[];
    loading: boolean;
    send: ({ message, ...rest }: OllamaSendFunctionProps) => void;
    ollama: {
        registerTool: (name: string, tool: Omit<import("../../types").AddToolProps, "name">) => /*elided*/ any;
        onMessage: (callback: import("../../types").OnResponseCallCallback) => /*elided*/ any;
        onError: (callback: import("../../types").OnErrorCallback) => /*elided*/ any;
        onStateChange: (callback: import("../../types").OnLoadingCallback) => /*elided*/ any;
        onToolCall: (callback: import("../../types").OnToolCallingCallback) => /*elided*/ any;
        onToolError: (callback: import("../../types").OnToolErrorCallback) => /*elided*/ any;
        onToolResult: (callback: import("../../types").OnToolResultCallback) => /*elided*/ any;
        send: (body: import("../../types").OllamaSendProps) => /*elided*/ any;
        abort: () => void;
    };
    setMessages: import("react").Dispatch<import("react").SetStateAction<WithTime<OllamaChatMessage>[]>>;
};
