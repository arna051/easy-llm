console.log(">>> top of file reached");
import { AxiosError } from "axios";
import { EasyLLM } from "../lib";
import { ChatMessage } from "../types";

const apiKey = process.argv[2]

console.log("starting...");

const messages: ChatMessage[] = [
    {
        role: 'system',
        content: 'you are a simple assistant'
    }
]

const llm = EasyLLM({ apiKey })
    .onError(err => {
        console.error("Error>\t", (err instanceof AxiosError ? err.response?.data : err.message) || err)
    })
    .onCall(response => {
        console.info("LLM-Call>\t", response.content || "doing a task...")
    })
    .onMessage(response => {
        console.info("LLM>\t", response.content)
        askUser()
    })
    .tool({
        func: () => new Date().toISOString(),
        desc: "a function to get current time in ISO format",
        name: 'get_time',
    })
    .tool({
        func: () => process.version || "22.0.1",
        desc: "a function to get current node version",
        name: 'get_node_version',
    })


function send(content?: string) {
    if (content)
        messages.push({
            role: 'user',
            content
        })
    llm.send({
        model: 'deepseek-chat',
        messages,
        tool_choice: 'auto'
    });
};

async function askUser() {
    const input = require("input")
    const content = await input.text('User>', { default: 'what time is it?' });
    send(content)
}

send();

