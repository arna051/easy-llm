export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    name?: string;
    tool_call_id?: string;
}

export interface ResponseFormat {
    type: 'text' | 'json' | string;
}

export interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];

    // Sampling parameters
    temperature?: number;
    top_p?: number;
    max_tokens?: number;

    // Penalties
    presence_penalty?: number;
    frequency_penalty?: number;

    // Response control
    stop?: string | string[] | null;

    // Response format
    response_format?: ResponseFormat;

    // Tool calling
    tools?: LLMToolSchema[] | null;
    tool_choice?: 'none' | 'auto' | string;

    // Log probabilities
    logprobs?: boolean;
    top_logprobs?: number | null;
}
