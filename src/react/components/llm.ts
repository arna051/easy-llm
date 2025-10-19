import { useState, useEffect, useRef } from 'react';
import { ChatCompletionMessage } from '../../types';
import { SendFunctionProps, useEasyLLMProps, WithTime } from '../../types/llm-hook';
import { EasyLLM } from '../../lib';
import { AxiosError } from 'axios';

export function useEasyLLM({
  systemPrompt,
  tools,
  onError,
  onMessage,
  onStateChange,
  onToolCall,
  onToolError,
  onToolResult,
  ...props
}: useEasyLLMProps) {
  const llmRef = useRef(EasyLLM(props));
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<WithTime<ChatCompletionMessage>[]>(
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
  const [toolErrors, setToolErrors] = useState<WithTime<Error & { id: string; name: string }>[]>(
    [],
  );

  const llm = llmRef.current;

  function send({ message, ...props }: SendFunctionProps) {
    const msgs: ChatCompletionMessage[] = messages.map((x: any) => {
      delete x.timestamp;
      return x;
    });

    msgs.push(message);

    setMessages((last) => [...last, { ...message, timestamp: Date.now() }]);

    llm.send({
      messages: msgs,
      ...props,
    });
  }

  useEffect(() => {
    llm.onStateChange((state) => {
      setLoading(state);
      onStateChange?.(state);
    });

    llm.onMessage((res) => {
      setMessages((last) => [...last, { ...res, timestamp: Date.now() }]);
      onMessage?.(res);
    });

    llm.onError((err) => {
      onError?.(err);
      if (err instanceof AxiosError)
        return setAxiosErrors((last) => [...last, { ...err, timestamp: Date.now() }]);
      setErrors((last) => [...last, { ...err, timestamp: Date.now() }]);
    });

    llm.onToolError((id, name, err) => {
      onToolError?.(id, name, err);
      if (!(err instanceof Error)) err = new Error(err);
      setToolErrors((last) => [...last, { ...err, timestamp: Date.now(), id, name }]);
    });

    if (onToolCall) llm.onToolCall(onToolCall);

    if (onToolResult) llm.onToolResult(onToolResult);

    tools?.forEach((tool) => {
      llm.registerTool(tool.name, tool);
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
    llm,
  };
}
