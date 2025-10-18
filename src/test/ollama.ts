console.log(">>> easy-ollama test");

import { EasyOllama } from "../lib";
import { ChatMessage } from "../types";

const [, , modelArg, urlArg] = process.argv;

const model = modelArg || "deepseek-r1:7b";
const config = urlArg ? { url: urlArg } : undefined;

const messages: ChatMessage[] = [
    {
        role: "system",
        content: "Help the user by calling functions when useful.",
    },
];

const client = EasyOllama(config)
    .tool({
        name: "get_time",
        desc: "Returns the current time in ISO format.",
        func: () => new Date().toISOString(),
    })
    .onCall((call) => {
        console.info("ToolCall>", call.tool_call_id);
    })
    .onMessage((message) => {
        console.info("Ollama>", message.content);
        askUser()
    })
    .onError((error) => {
        console.error("Error>", error.message);
        process.exit(1);
    });

function send(content?: string) {
    if (content)
        messages.push({
            role: 'user',
            content
        })
    client.send({
        model,
        messages,
    });
};

async function askUser() {
    const input = require("input")
    const content = await input.text('User>', { default: 'what time is it?' });
    send(content)
}

send();

