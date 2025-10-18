# 🎩 Easy LLM Tool Manager

> Build function-calling copilots in minutes with a fluent TypeScript API that speaks to hosted clouds (DeepSeek, OpenAI-compatible) and your local Ollama models alike.

---

## Table of Contents
- [✨ Overview](#-overview)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
  - [Node Usage](#node-usage)
  - [React Hook Example](#react-hook-example)
  - [Plain Browser Example](#plain-browser-example)
- [🧩 Why Easy LLM?](#-why-easy-llm)
- [🛠️ Tool Recipes](#-tool-recipes)
- [🤝 Supported Providers](#-supported-providers)
- [⚙️ API Surface](#-api-surface)
- [🧪 Local Sandbox (Ollama)](#-local-sandbox-ollama)
- [🛟 Troubleshooting](#-troubleshooting)
- [📄 License](#-license)

---

## ✨ Overview
- Fluent builder that wires **chat completions + function calling** without ceremony.
- Drop-in support for **DeepSeek**, **OpenAI-compatible** endpoints, and a dedicated **Ollama streaming** client.
- Ergonomic callbacks for **tool invocations**, **assistant replies**, and **error handling**.
- Ships with TypeScript declarations so IDEs guide your tool shapes and chat payloads.

---

## 📦 Installation

```bash
npm install easy-llm
# or
yarn add easy-llm
# or
pnpm add easy-llm
```

The package exposes CommonJS builds (`dist/`) with bundled type definitions.

---

## 🚀 Quick Start

### Node Usage

```ts
import { EasyLLM } from "easy-llm";

const client = EasyLLM({
  apiKey: process.env.DEEPSEEK_API_KEY,
  // url: "https://api.openai.com/v1/chat/completions", // optional override
})
  .tool({
    name: "get_time",
    desc: "Returns the current ISO timestamp.",
    func: () => new Date().toISOString(),
  })
  .tool({
    name: "lookupWeather",
    desc: "Fetches weather from a custom service.",
    props: {
      city: { type: "string", desc: "City to inspect", required: true },
      units: { type: "string", desc: "Units (metric|imperial)" },
    },
    func: async ({ city, units = "metric" }) => {
      // your business logic here
      return `It is always sunny in ${city} (units: ${units}).`;
    },
  })
  .onCall((call) => {
    console.info("🔧 Tool call:", call.tool_call_id, call.content ?? "");
  })
  .onMessage((message) => {
    console.info("🤖 Assistant:", message.content);
  })
  .onError((error) => {
    console.error("💥 LLM error:", error);
  });

await client.send({
  model: "deepseek-chat",
  messages: [
    { role: "system", content: "You are a helpful concierge." },
    { role: "user", content: "Can you plan my afternoon?" },
  ],
  tool_choice: "auto",
});
```

### React Hook Example

```tsx
import { useEffect, useState } from "react";
import { EasyLLM } from "easy-llm";

export function ConciergeExample() {
  const [assistant, setAssistant] = useState<string>("Thinking…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const messages = [
      { role: "system", content: "You are a succinct trip planner." },
      { role: "user", content: "Create a walking itinerary for Seoul." },
    ];

    const client = EasyLLM({ apiKey: import.meta.env.VITE_DEEPSEEK_KEY })
      .tool({
        name: "open_map",
        desc: "Opens a map at a specific coordinate.",
        props: {
          lat: { type: "number", required: true },
          lng: { type: "number", required: true },
        },
        func: async ({ lat, lng }) => {
          window.open(`https://maps.google.com/?q=${lat},${lng}`, "_blank");
          return "Map opened in a new tab.";
        },
      })
      .onCall(() => setBusy(true))
      .onMessage((resp) => {
        setAssistant(resp.content);
        setBusy(false);
      })
      .onError((err) => {
        console.error(err);
        setAssistant("Something went wrong.");
        setBusy(false);
      });

    client.send({ model: "deepseek-chat", messages, tool_choice: "auto" });
    return () => client.abort();
  }, []);

  return (
    <section>
      <p>{assistant}</p>
      {busy && <span>🔄 calling tools…</span>}
    </section>
  );
}
```

> The library is CommonJS; for Vite/Next bundlers make sure you enable CJS interop (default in most modern setups).

### Plain Browser Example

```html
<script type="module">
  import EasyLLMModule from "https://cdn.skypack.dev/easy-llm";
  const { EasyLLM } = EasyLLMModule;

  const client = EasyLLM({ apiKey: window.DEEPSEEK_KEY })
    .tool({
      name: "show_alert",
      desc: "Displays a friendly alert dialog.",
      func: ({ message }) => {
        alert(message ?? "Hello from Easy LLM!");
        return "Alert was shown to the user.";
      },
    })
    .onMessage((msg) => {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<pre>${msg.content}</pre>`,
      );
    });

  client.send({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: "You control the UI via tools." },
      { role: "user", content: "Say hi to the visitor." },
    ],
    tool_choice: "auto",
  });
</script>
```

> For production you should proxy your API key server-side. The snippet above is purely illustrative for demos and local prototypes.

---

## 🧩 Why Easy LLM?
- **Chainable ergonomics** – register tools, add callbacks, and send messages in one fluent expression.
- **Strong typing** – helper types (`ChatMessage`, `AddToolProps`, etc.) make TypeScript autocompletion delightful.
- **Abort-aware** – cancel long-running interactions with `abort()` (automatically refreshed per request).
- **Tool normalization** – JSON arguments are sanitized so your functions always receive real objects.
- **Streaming-friendly** – the Ollama client parses line-delimited JSON chunks and routes tool calls automatically.

---

## 🛠️ Tool Recipes
- **Dynamic schemas**: pass `props` to describe argument types, `required` fields, and inline docs. The library emits OpenAI-compatible JSON Schema on the wire.
- **Side-effect tools**: return anything serializable; the assistant receives the value as tool output.
- **Multi-tool orchestration**: call `.tool(...)` repeatedly—the registry keeps both the schema sent to the LLM and the implementation map.
- **Graceful fallbacks**: use `.onCall` to surface loading indicators while your UI waits on tool results.

---

## 🤝 Supported Providers
- **`EasyLLM`** – default target is `https://api.deepseek.com/chat/completions`; override `url` for OpenAI, dify, or any compatible Chat Completions endpoint.
- **`EasyOllama`** – speaks to a local Ollama instance (`http://localhost:11434/api/chat`). Handles streaming, JSON-tool detection, and response sanitization out of the box.

Both clients share the same tool API, so migrating between cloud and local models is a one-line change.

---

## ⚙️ API Surface

### `EasyLLM(options?: { url?: string; apiKey?: string })`
- `tool({ name, desc, func, props })` – register a function callable by the model.
- `onCall(callback)` – firing whenever the model requests a tool (great for progress UX).
- `onMessage(callback)` – receives assistant messages once the conversation resolves.
- `onError(callback)` – central place for Axios/LLM errors.
- `send({ model, messages, tool_choice, ... })` – triggers the request; returns the fluent interface for chaining.
- `abort()` – cancel the in-flight request.

### `EasyOllama(options?: { url?: string; headers?: Record<string,string> })`
- Mirrors the `EasyLLM` surface but targets streaming Ollama sessions. Each call automatically injects a system instruction explaining available tools.

Refer to `src/types/` for the full TypeScript definitions shipped with the package.

---

## 🧪 Local Sandbox (Ollama)
```bash
# run a model locally
ollama pull deepseek-r1:7b
ollama serve

# in another terminal
npx ts-node src/test/ollama.ts deepseek-r1:7b
```
The example registers a `get_time` tool, relays streaming output, and showcases how EasyOllama loops until the assistant provides a final answer.

---

## 🛟 Troubleshooting
- **401 / unauthorized** – confirm the `apiKey` is set and the target endpoint expects Bearer tokens.
- **Hanging requests** – use `abort()` or set `tool_choice: "none"` when you do not intend to invoke functions.
- **Tool schema mismatch** – double-check `props` definitions; required fields must align with the arguments returned by your tool function.
- **Bundlers** – when consuming from ESM-only environments, enable CommonJS interop or import from `dist/index.js` directly.

---

## 📄 License

MIT © Hussain Nazarnejad

Crafted with ❤️ to make LLM function calling *easy*.

