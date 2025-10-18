"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EasyOllama = EasyOllama;
const axios_1 = __importDefault(require("axios"));
const send_1 = require("./send");
const utils_1 = require("../easy-llm/utils");
const DEFAULT_OLLAMA_URL = "http://localhost:11434/api/chat";
function EasyOllama({ url = DEFAULT_OLLAMA_URL, headers } = {}) {
    const https = axios_1.default.create({
        baseURL: url,
        headers,
        timeout: 1e3 * 60 * 10,
    });
    const tools = [];
    const functions = {};
    const callbacks = {
        tool: () => null,
        message: () => null,
        error: () => null,
    };
    const others = { signal: new AbortController() };
    const returnObject = {
        tool(tool) {
            (0, utils_1.toolRegister)({ tools, functions, tool });
            return returnObject;
        },
        onCall(callback) {
            callbacks.tool = callback;
            return returnObject;
        },
        onMessage(callback) {
            callbacks.message = callback;
            return returnObject;
        },
        onError(callback) {
            callbacks.error = callback;
            return returnObject;
        },
        send(body) {
            (0, send_1.sendRequest)({
                axios: https,
                callbacks,
                body,
                others,
                tools,
                functions,
            });
            return returnObject;
        },
        abort() {
            others.signal.abort();
            others.signal = new AbortController();
            return returnObject;
        },
    };
    return returnObject;
}
