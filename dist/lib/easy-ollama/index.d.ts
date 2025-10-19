import { AddToolProps, EasyOllamaProps, OllamaSendProps, OnErrorCallback, OnLoadingCallback, OnResponseCallCallback, OnToolCallingCallback, OnToolErrorCallback, OnToolResultCallback } from '../../types';
export declare function EasyOllama({ url, timeoutMS, retries, retryDelay, betweenRequestDelay, headers, }?: EasyOllamaProps): {
    registerTool: (name: string, tool: Omit<AddToolProps, "name">) => /*elided*/ any;
    onMessage: (callback: OnResponseCallCallback) => /*elided*/ any;
    onError: (callback: OnErrorCallback) => /*elided*/ any;
    onStateChange: (callback: OnLoadingCallback) => /*elided*/ any;
    onToolCall: (callback: OnToolCallingCallback) => /*elided*/ any;
    onToolError: (callback: OnToolErrorCallback) => /*elided*/ any;
    onToolResult: (callback: OnToolResultCallback) => /*elided*/ any;
    send: (body: OllamaSendProps) => /*elided*/ any;
    abort: () => void;
};
