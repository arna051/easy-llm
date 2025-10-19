console.log('>>> top of file reached');
import { AxiosError } from 'axios';
import { EasyLLM } from '../src/lib';
import { ChatCompletionMessage } from '../src/types';

const apiKey = process.argv[2];

console.log('starting...');

const messages: ChatCompletionMessage[] = [
  {
    role: 'system',
    content: 'you are a simple assistant',
  },
];

const llm = EasyLLM({ apiKey })
  .onError((err) => {
    console.error(
      'Error>\t',
      (err instanceof AxiosError ? err.response?.data : err.message) || err,
    );
  })
  .onStateChange((state) => {
    console.log('Status>\t', state);
  })
  .onToolCall((name, args) => {
    console.log('Tool-Calling>\t', name, '\t', args);
  })
  .onToolResult((name, args, res) => {
    console.log('Tool-Result>\t', name, '\t', args, '\t', res);
  })
  .onToolError((name, args) => {
    console.log('Tool-Error>\t', name, '\t', args);
  })
  .onMessage((response) => {
    console.info('LLM>\t', response.content);
    askUser();
  })
  .registerTool('get_time', {
    func: () => new Date().toISOString(),
    desc: 'a function to get current time in ISO format',
  })
  .registerTool('get_node_version', {
    func: () => process.version || '22.0.1',
    desc: 'a function to get current node version',
  });

function send(content?: string) {
  if (content)
    messages.push({
      role: 'user',
      content,
    });
  llm.send({
    model: 'deepseek-chat',
    messages,
    tool_choice: 'auto',
  });
}

async function askUser() {
  const input = require('input');
  const content = await input.text('User>', { default: 'what time is it?' });
  send(content);
}

send();
