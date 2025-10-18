import { AddToolProps, EasyLLMProps, OnErrorCallback, OnResponseCallCallback, OnToolCallCallback, SendProps } from '../../types';
export declare function EasyLLM({ url, apiKey, }: EasyLLMProps): {
    tool: (tool: AddToolProps) => /*elided*/ any;
    onCall: (callback: OnToolCallCallback) => /*elided*/ any;
    onMessage: (callback: OnResponseCallCallback) => /*elided*/ any;
    onError: (callback: OnErrorCallback) => /*elided*/ any;
    send: (body: SendProps) => /*elided*/ any;
    abort: () => void;
};
