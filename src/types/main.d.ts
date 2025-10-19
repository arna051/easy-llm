export type EasyLLMProps = {
  url?: string;
  apiKey?: string;
  timeoutMS?: number;
  retries?: number;
  retryDelay?: number;
  betweenRequestDelay?: number;
};

export type OtherProps = {
  signal: AbortController;
};
