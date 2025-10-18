import { AxiosInstance } from "axios";
import { ChatMessage } from "./body";
import { OnErrorCallback, OnResponseCallCallback, OnToolCallCallback } from "./message";
import { AddToolProps, FunctionAny, LLMToolSchema } from "./tool";

export interface EasyOllamaProps {
    url?: string;
    headers?: Record<string, string>;
}

export interface OllamaChatRequest {
    model: string;
    messages: ChatMessage[];
    format?: string | Record<string, unknown>;
    options?: Record<string, unknown>;
    keep_alive?: number | string | boolean;
}

export interface OllamaMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
}

export interface OllamaChatResponse {
    model: string;
    created_at: string;
    message: OllamaMessage;
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
    done_reason?: string | null;
}

export interface OllamaCallbacks {
    tool: OnToolCallCallback;
    message: OnResponseCallCallback;
    error: OnErrorCallback;
}

export interface OllamaSendFunctionProps {
    axios: AxiosInstance;
    callbacks: OllamaCallbacks;
    body: OllamaChatRequest;
    others: { signal: AbortController };
    tools: LLMToolSchema[];
    functions: Record<string, FunctionAny>;
}

export type OllamaSendFunction = (props: OllamaSendFunctionProps) => Promise<void>;

export type OllamaSendProps = OllamaChatRequest;
