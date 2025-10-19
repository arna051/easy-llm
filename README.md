# easy-llm-call

![easy-llm-call banner](https://images.contentstack.io/v3/assets/bltac01ee6daa3a1e14/bltef59cf5734b5c965/67e3ca9ab9f9a67f5adc5547/img_blog_BP-Run-DeepSeek-R1-Locally-and-Build-RAG-Applications_feature.png?width=736&disable=upscale&auto=webp)

> Build tool-aware LLM workflows in Node.js or React with a few lines of code.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Package Layout](#package-layout)
- [Installation](#installation)
- [Quick Start – DeepSeek / OpenAI Style](#quick-start--deepseek--openai-style)
- [Quick Start – Ollama (local)](#quick-start--ollama-local)
- [React Hooks](#react-hooks)
- [Tool Recipes](#tool-recipes)
- [Configuration Reference](#configuration-reference)
- [Callbacks & Lifecycle](#callbacks--lifecycle)
- [Error Handling](#error-handling)
- [Development & Testing](#development--testing)
- [License](#license)

## Overview

`easy-llm-call` wraps common LLM/chat-completion patterns (including function/tool calling) behind a compact API. It ships with:

- **EasyLLM**: drop-in client for OpenAI-compatible HTTP chat endpoints (tested with DeepSeek).
- **EasyOllama**: local Ollama chat client with tool calling support.
- **React hooks** that manage message history, loading states, errors, and tool wiring.
- A shared toolkit for registering tools, retrying calls, aborting requests, and normalizing messages.

Use this package when you want tooling-enabled assistants across hosted or local models without re-implementing the control loop.

## Key Features

- Tool/function calling with automatic argument parsing and tool result injection.
- Configurable retry strategy with exponential-style delays.
- Abortable requests via `AbortController`.
- Unified callback interface for streaming UI updates or server logging.
- TypeScript-first design with ambient type definitions for every surface area.
- React hooks (`useEasyLLM`, `useEasyOllama`) to integrate assistants in minutes.

## Package Layout

```
src/
├── lib/
│   ├── easy-llm/        # Hosted LLM helper (DeepSeek, OpenAI-compatible)
│   └── easy-ollama/     # Local Ollama helper with tool calling
├── react/
│   └── components/      # React hooks for both helpers
├── types/               # Shared ambient type definitions
└── utils/               # axios retry helper
test/
├── app.ts               # Interactive EasyLLM demo (DeepSeek, OpenAI, etc.)
└── ollama.ts            # Interactive EasyOllama demo
```

All public exports flow through:

- `src/lib/index.ts` → `EasyLLM`, `EasyOllama`
- `src/react/index.ts` → `useEasyLLM`, `useEasyOllama`
- `src/types/index.d.ts` → ambient types for library consumers

## Installation

```bash
npm install easy-llm-call
# or
yarn add easy-llm-call
```

Peer dependency: `react >= 17` (only needed for hook usage).

## Quick Start – DeepSeek / OpenAI Style

```ts
import { EasyLLM } from 'easy-llm-call';

const llm = EasyLLM({
  apiKey: process.env.DEEPSEEK_API_KEY,
  url: 'https://api.deepseek.com/chat/completions',
})
  .registerTool('get_time', {
    desc: 'Return the current ISO timestamp',
    func: () => new Date().toISOString(),
  })
  .onMessage((message) => {
    console.log('[assistant]', message.content);
  })
  .onToolCall((id, name, args) => {
    console.log('[tool call]', { id, name, args });
  })
  .onToolResult((id, name, result) => {
    console.log('[tool result]', { id, name, result });
  })
  .onError((err) => {
    console.error('[error]', err);
  });

llm.send({
  model: 'deepseek-chat',
  tool_choice: 'auto',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What time is it in UTC?' },
  ],
});
```

## Quick Start – Ollama (local)

```ts
import { EasyOllama } from 'easy-llm-call';

const ollama = EasyOllama({
  url: 'http://127.0.0.1:11434/api/chat', // default
})
  .registerTool('get_weather', {
    desc: 'Fetches weather for a city',
    props: {
      city: { desc: 'City name', required: true },
    },
    func: async ({ city }) => {
      // call your own weather API here
      return `Weather for ${city} is 22°C and sunny`;
    },
  })
  .onMessage((message) => console.log('[assistant]', message.content))
  .onToolCall((id, name, args) => console.log('[tool call]', { id, name, args }))
  .onError((err) => console.error(err));

ollama.send({
  model: 'llama3.1:8b',
  tool_choice: 'auto',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Should I carry an umbrella in Tokyo today?' },
  ],
});
```

> ℹ️ The Ollama API must be running locally with a model that supports tool/function calling.

## React Hooks

```tsx
import { useEasyLLM } from 'easy-llm-call/react';

export function ChatWidget() {
  const {
    messages,
    loading,
    send,
    errors: { axiosErrors, toolErrors },
  } = useEasyLLM({
    apiKey: process.env.DEEPSEEK_API_KEY!,
    systemPrompt: 'You are a friendly concierge.',
    tools: [
      {
        name: 'get_time',
        desc: 'Return current ISO timestamp',
        func: () => new Date().toISOString(),
      },
    ],
  });

  return (
    <div>
      <ul>
        {messages.map(({ role, content, timestamp }) => (
          <li key={timestamp}>
            <strong>{role}:</strong> {content}
          </li>
        ))}
      </ul>
      <button disabled={loading} onClick={() => send({
        message: { role: 'user', content: 'Ping!' },
        model: 'deepseek-chat',
        tool_choice: 'auto',
      })}>
        {loading ? 'Waiting…' : 'Send'}
      </button>
      {axiosErrors.length > 0 && <pre>{axiosErrors.at(-1)?.message}</pre>}
      {toolErrors.length > 0 && <pre>{toolErrors.at(-1)?.message}</pre>}
    </div>
  );
}
```

The hook mirrors the plain factory API while maintaining stateful message history, loading flags, and error buckets for UI binding.

An equivalent `useEasyOllama` hook targets local models:

```tsx
import { useEasyOllama } from 'easy-llm-call/react';

const { messages, send } = useEasyOllama({
  systemPrompt: 'You are a local assistant.',
  tools: [
    {
      name: 'echo',
      desc: 'Return the same text back',
      props: { text: { required: true } },
      func: ({ text }) => text,
    },
  ],
});
```

## Tool Recipes

### 1. Basic synchronous tool

```ts
llm.registerTool('get_version', {
  desc: 'Return Node.js version',
  func: () => process.version,
});
```

### 2. Tools with typed parameters

```ts
llm.registerTool('calculate_bmi', {
  desc: 'Compute BMI from height and weight',
  props: {
    height_cm: { type: 'number', required: true },
    weight_kg: { type: 'number', required: true },
  },
  func: ({ height_cm, weight_kg }) => {
    const meters = height_cm / 100;
    return (weight_kg / (meters * meters)).toFixed(2);
  },
});
```

### 3. Async tools that call external APIs

```ts
llm.registerTool('search_docs', {
  desc: 'Search documentation',
  props: { query: { required: true } },
  func: async ({ query }) => {
    const res = await fetch('https://docs.example.com/search?q=' + encodeURIComponent(query));
    const { results } = await res.json();
    return results.slice(0, 3);
  },
});
```

### 4. Shared tool registry

Create a reusable helper:

```ts
// tools.ts
export const registerCommonTools = (client) =>
  client
    .registerTool('get_time', { func: () => new Date().toISOString(), desc: 'Now in ISO' })
    .registerTool('echo', {
      desc: 'Echo input text',
      props: { text: { required: true } },
      func: ({ text }) => text,
    });
```

```ts
import { EasyOllama } from 'easy-llm-call';
import { registerCommonTools } from './tools';

const client = registerCommonTools(EasyOllama());
```

## Configuration Reference

### Factory options

| Option               | EasyLLM | EasyOllama | Default                                | Notes                               |
|----------------------|---------|------------|----------------------------------------|-------------------------------------|
| `url`                | ✔       | ✔          | DeepSeek / http://127.0.0.1:11434/api/chat | Override API endpoint               |
| `apiKey`             | ✔       | ✖          | `undefined`                            | Injected in `Authorization` header  |
| `headers`            | ✖       | ✔          | `{}`                                   | Extra headers for Ollama            |
| `timeoutMS`          | ✔       | ✔          | 180000                                  | Axios request timeout               |
| `retries`            | ✔       | ✔          | 3                                      | Number of retry attempts            |
| `retryDelay`         | ✔       | ✔          | 1000                                   | Delay between retries (ms)          |
| `betweenRequestDelay`| ✔       | ✔          | 0                                      | Sleep after tool calls before retry |

### `send(...)` payload

Both helpers expect objects compatible with their respective chat endpoints:

- `EasyLLM.send(request)` matches OpenAI/DeepSeek `ChatCompletionRequest`
- `EasyOllama.send(request)` matches the Ollama `/api/chat` payload

Common fields:

- `model` – required model name.
- `messages` – array of chat messages; tools inject tool responses automatically.
- `tools` – optional, auto-populated from registered tool schemas.
- `tool_choice` – `'auto' | 'none' | string` to control invocation.

## Callbacks & Lifecycle

Every factory exposes chainable listeners:

- `onMessage(message)` – fires for assistant messages (including tool-call previews).
- `onError(error)` – called once per failing request (after retries exhausted).
- `onStateChange(loading)` – toggles `true/false` around request cycles.
- `onToolCall(id, toolName, args)` – before executing a registered tool.
- `onToolResult(id, toolName, result)` – after tool resolves.
- `onToolError(id, toolName, error)` – when a tool throws/errors.

Return value from `registerTool` and `send` is the same client, enabling fluent chaining.

## Error Handling

- Network failures are retried using `axiosWithRetry` (see `src/utils/retry.ts`).
- Tool exceptions are captured, forwarded to callbacks, and converted into synthetic tool messages so the model can react.
- To cancel a long-running request, invoke `client.abort()`. The current `AbortController` is swapped in before each call.

## Development & Testing

```bash
# Build TypeScript
npm run build

# Interactive DeepSeek-style demo
npm run test -- "<YOUR_MODEL_KEY>"

# Interactive Ollama demo (model, endpoint optional)
npm run test:ollama llama3.1:8b
```

During development you may inspect the TypeScript sources directly (`src/`); compiled JavaScript and declaration files live in `dist/`.

## License

MIT © Arna051
