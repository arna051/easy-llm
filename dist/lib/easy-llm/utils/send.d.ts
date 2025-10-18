import { ChatCompletionMessage, ChatMessage, SendFunction } from '../../../types';
export declare const SendRequest: SendFunction;
export declare function normalizeChatMessage(msg: ChatMessage & ChatCompletionMessage): ChatMessage & ChatCompletionMessage;
