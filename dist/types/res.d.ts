export interface LLMToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // raw JSON string
  };
}
export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';
export interface ChatCompletionMessage {
  role: ChatRole;
  content: string | null;
  tool_calls?: LLMToolCall[];
  reasoning_content?: string | null; // deepseek-reasoner models
  tool_call_id?: string;
  name?: string;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatCompletionMessage;
  finish_reason:
    | 'stop'
    | 'length'
    | 'tool_calls'
    | 'content_filter'
    | 'insufficient_system_resource';
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
