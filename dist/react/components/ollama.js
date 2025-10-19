"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEasyOllama = useEasyOllama;
const react_1 = require("react");
const axios_1 = require("axios");
const lib_1 = require("../../lib");
function useEasyOllama({ systemPrompt, tools, onError, onMessage, onStateChange, onToolCall, onToolError, onToolResult, ...props }) {
    const ollamaRef = (0, react_1.useRef)((0, lib_1.EasyOllama)(props));
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [messages, setMessages] = (0, react_1.useState)(systemPrompt
        ? [
            {
                role: 'system',
                content: systemPrompt,
                timestamp: Date.now(),
            },
        ]
        : []);
    const [errors, setErrors] = (0, react_1.useState)([]);
    const [axiosErrors, setAxiosErrors] = (0, react_1.useState)([]);
    const [toolErrors, setToolErrors] = (0, react_1.useState)([]);
    const ollama = ollamaRef.current;
    function send({ message, ...rest }) {
        const history = messages.map((entry) => {
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
    (0, react_1.useEffect)(() => {
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
            if (err instanceof axios_1.AxiosError) {
                setAxiosErrors((prev) => [...prev, { ...err, timestamp: Date.now() }]);
            }
            else {
                setErrors((prev) => [...prev, { ...err, timestamp: Date.now() }]);
            }
        });
        ollama.onToolError((id, name, err) => {
            onToolError?.(id, name, err);
            if (!(err instanceof Error))
                err = new Error(err);
            setToolErrors((prev) => [...prev, { ...err, timestamp: Date.now(), id, name }]);
        });
        if (onToolCall)
            ollama.onToolCall(onToolCall);
        if (onToolResult)
            ollama.onToolResult(onToolResult);
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
