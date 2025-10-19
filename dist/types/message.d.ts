import { AxiosError } from 'axios';

export interface ChatToolMessage {
  role: 'tool';
  content: string;
  tool_call_id: string;
}
export interface ChatResponseMessage {
  role: 'assistant';
  content: string;
}

export type OnToolCallCallback = (
  message: Omit<ChatToolMessage, 'content'> & { content?: null | string },
) => void;
export type OnResponseCallCallback = (message: ChatResponseMessage) => void;
export type OnErrorCallback = (error: Error | AxiosError) => void;
export type OnToolErrorCallback = (id: string, toolName: string, error: any) => void;
export type OnToolCallingCallback = (id: string, toolName: string, args: any) => void;
export type OnToolResultCallback = (id: string, toolName: string, result: any) => void;
export type OnLoadingCallback = (loading: boolean) => void;
// export type OnLoadingCallback = (loading: boolean) => void;

export type Callbacks = {
  onMessage: OnResponseCallCallback;
  onError: OnErrorCallback;
  onToolError: OnToolErrorCallback;
  onToolCall: OnToolCallingCallback;
  onToolResult: OnToolResultCallback;
  onStateChange: OnLoadingCallback;
};
