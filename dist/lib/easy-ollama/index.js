"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EasyOllama = EasyOllama;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("../easy-llm/utils");
const utils_2 = require("./utils");
function EasyOllama({ url = 'http://127.0.0.1:11434/api/chat', timeoutMS = 1e3 * 60 * 3, retries = 3, retryDelay = 1e3, betweenRequestDelay = 0, headers = {}, } = {}) {
    const https = axios_1.default.create({
        baseURL: url,
        headers,
        timeout: timeoutMS,
    });
    const tools = [];
    const functions = {};
    const callbacks = {
        onMessage: () => null,
        onError: () => null,
        onStateChange: () => null,
        onToolCall: () => null,
        onToolError: () => null,
        onToolResult: () => null,
    };
    const others = {
        signal: new AbortController(),
    };
    const returnObject = {
        registerTool: (name, tool) => {
            (0, utils_1.toolRegister)({ tools, functions, tool: { ...tool, name } });
            return returnObject;
        },
        onMessage: (callback) => {
            callbacks.onMessage = callback;
            return returnObject;
        },
        onError: (callback) => {
            callbacks.onError = callback;
            return returnObject;
        },
        onStateChange: (callback) => {
            callbacks.onStateChange = callback;
            return returnObject;
        },
        onToolCall: (callback) => {
            callbacks.onToolCall = callback;
            return returnObject;
        },
        onToolError: (callback) => {
            callbacks.onToolError = callback;
            return returnObject;
        },
        onToolResult: (callback) => {
            callbacks.onToolResult = callback;
            return returnObject;
        },
        send: (body) => {
            (0, utils_2.SendRequest)({
                axios: https,
                callbacks,
                functions,
                others,
                tools,
                body,
                betweenRequestDelay,
                retries,
                retryDelay,
            });
            return returnObject;
        },
        abort: () => {
            others.signal.abort();
        },
    };
    return returnObject;
}
