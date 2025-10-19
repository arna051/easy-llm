import { useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { EasyOllama } from '../../lib';
import { OllamaChatMessage } from '../../types';
import { WithTime } from '../../types/llm-hook';
import { OllamaSendFunctionProps, useEasyOllamaProps } from '../../types/ollama-hook';

export function useEasyOllama({
  systemPrompt,
  tools,
  onError,
  onMessage,
  onStateChange,
  onToolCall,
  onToolError,
  onToolResult,
  ...props
}: useEasyOllamaProps) {
  const ollamaRef = useRef(EasyOllama(props));
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<WithTime<OllamaChatMessage>[]>(
    systemPrompt
      ? [
          {
            role: 'system',
            content: systemPrompt,
            timestamp: Date.now(),
          },
        ]
      : [],
  );
  const [errors, setErrors] = useState<WithTime<Error>[]>([]);
  const [axiosErrors, setAxiosErrors] = useState<WithTime<AxiosError>[]>([]);
  const [toolErrors, setToolErrors] = useState<
    WithTime<Error & { id: string; name: string }>[]
  >([]);

  const ollama = ollamaRef.current;

  function send({ message, ...rest }: OllamaSendFunctionProps) {
    const history: OllamaChatMessage[] = messages.map((entry: any) => {
      const { timestamp, ...msg } = entry;
      return msg;
    });

    history.push(message);

    setMessages((prev) => [...prev, { ...message, timestamp: Date.now() }]);

    ollama.send({
      ...rest,
      messages: history,
    });
  }

  useEffect(() => {
    ollama.onStateChange((state) => {
      setLoading(state);
      onStateChange?.(state);
    });

    ollama.onMessage((res) => {
      setMessages((prev) => [...prev, { ...res, timestamp: Date.now() }]);
      onMessage?.(res);
    });

    ollama.onError((err) => {
      onError?.(err);
      if (err instanceof AxiosError) {
        setAxiosErrors((prev) => [...prev, { ...err, timestamp: Date.now() }]);
      } else {
        setErrors((prev) => [...prev, { ...err, timestamp: Date.now() }]);
      }
    });

    ollama.onToolError((id, name, err) => {
      onToolError?.(id, name, err);
      if (!(err instanceof Error)) err = new Error(err);
      setToolErrors((prev) => [...prev, { ...err, timestamp: Date.now(), id, name }]);
    });

    if (onToolCall) ollama.onToolCall(onToolCall);
    if (onToolResult) ollama.onToolResult(onToolResult);

    tools?.forEach((tool) => {
      ollama.registerTool(tool.name, tool);
    });
  }, []);

  return {
    errors: {
      errors,
      axiosErrors,
      toolErrors,
    },
    messages,
    loading,
    send,
    ollama,
  };
}
