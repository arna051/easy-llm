import { AddToolProps, OnToolCallCallback, OnResponseCallCallback, OnErrorCallback } from '../../types';
import { EasyOllamaProps, OllamaSendProps } from '../../types/ollama';
export declare function EasyOllama({ url, headers }?: EasyOllamaProps): {
    tool(tool: AddToolProps): /*elided*/ any;
    onCall(callback: OnToolCallCallback): /*elided*/ any;
    onMessage(callback: OnResponseCallCallback): /*elided*/ any;
    onError(callback: OnErrorCallback): /*elided*/ any;
    send(body: OllamaSendProps): /*elided*/ any;
    abort(): /*elided*/ any;
};
