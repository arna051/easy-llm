"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEasyLLM = useEasyLLM;
const react_1 = require("react");
const lib_1 = require("../../lib");
const axios_1 = require("axios");
function useEasyLLM({ systemPrompt, tools, onError, onMessage, onStateChange, onToolCall, onToolError, onToolResult, ...props }) {
    const llmRef = (0, react_1.useRef)((0, lib_1.EasyLLM)(props));
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
    const llm = llmRef.current;
    function send({ message, ...props }) {
        const msgs = messages.map((x) => {
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
    (0, react_1.useEffect)(() => {
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
            if (err instanceof axios_1.AxiosError)
                return setAxiosErrors((last) => [...last, { ...err, timestamp: Date.now() }]);
            setErrors((last) => [...last, { ...err, timestamp: Date.now() }]);
        });
        llm.onToolError((id, name, err) => {
            onToolError?.(id, name, err);
            if (!(err instanceof Error))
                err = new Error(err);
            setToolErrors((last) => [...last, { ...err, timestamp: Date.now(), id, name }]);
        });
        if (onToolCall)
            llm.onToolCall(onToolCall);
        if (onToolResult)
            llm.onToolResult(onToolResult);
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
        setMessages
    };
}
