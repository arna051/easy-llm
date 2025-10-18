import { AxiosError } from "axios";

export interface ChatToolMessage {
    role: 'tool';
    content: string;
    tool_call_id: string;
}
export interface ChatResponseMessage {
    role: 'assistant';
    content: string;
}

export type OnToolCallCallback = (message: Omit<ChatToolMessage, "content"> & { content?: null | string }) => void
export type OnResponseCallCallback = (message: ChatResponseMessage) => void
export type OnErrorCallback = (error: Error | AxiosError) => void


export type Callbacks = {
    tool: OnToolCallCallback
    message: OnResponseCallCallback
    error: OnErrorCallback
}