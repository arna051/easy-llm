"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EasyLLM = EasyLLM;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
function EasyLLM({ url = 'https://api.deepseek.com/chat/completions', apiKey }) {
    const https = axios_1.default.create({
        baseURL: url,
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        timeout: 1e3 * 60 * 10,
    });
    const tools = [];
    const functions = {};
    const callbacks = {
        tool: () => null,
        message: () => null,
        error: () => null
    };
    const others = {
        signal: new AbortController()
    };
    const returnObject = {
        tool: (tool) => {
            (0, utils_1.toolRegister)({ tools, functions, tool });
            return returnObject;
        },
        onCall: (callback) => {
            callbacks.tool = callback;
            return returnObject;
        },
        onMessage: (callback) => {
            callbacks.message = callback;
            return returnObject;
        },
        onError: (callback) => {
            callbacks.error = callback;
            return returnObject;
        },
        send: (body) => {
            (0, utils_1.SendRequest)({
                axios: https,
                callbacks,
                functions,
                others,
                tools,
                body
            });
            return returnObject;
        },
        abort: () => {
            others.signal.abort();
        }
    };
    return returnObject;
}
