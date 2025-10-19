import { AddToolProps, EasyLLMProps, OnErrorCallback, OnResponseCallCallback, SendProps, OnLoadingCallback, OnToolErrorCallback, OnToolResultCallback, OnToolCallingCallback } from '../../types';
export declare function EasyLLM({ url, apiKey, betweenRequestDelay, retries, retryDelay, timeoutMS, }: EasyLLMProps): {
    registerTool: (name: string, tool: Omit<AddToolProps, "name">) => /*elided*/ any;
    onMessage: (callback: OnResponseCallCallback) => /*elided*/ any;
    onError: (callback: OnErrorCallback) => /*elided*/ any;
    onStateChange: (callback: OnLoadingCallback) => /*elided*/ any;
    onToolCall: (callback: OnToolCallingCallback) => /*elided*/ any;
    onToolError: (callback: OnToolErrorCallback) => /*elided*/ any;
    onToolResult: (callback: OnToolResultCallback) => /*elided*/ any;
    send: (body: SendProps) => /*elided*/ any;
    abort: () => void;
};
