import { AddToolProps, FunctionAny, LLMToolParameter, LLMToolSchema } from "../../../types";

export function toolRegister({ tools, functions, tool }: { tools: LLMToolSchema[], functions: Record<string, FunctionAny>, tool: AddToolProps }) {
    const cookedTool: LLMToolSchema = {
        type: 'function',
        function: {
            name: tool.name,
            description: tool.desc,
        },
    };

    if (tool.props && Object.keys(tool.props).length > 0) {
        const parameters: LLMToolParameter = {
            type: 'object',
            properties: {},
            required: [],
        };

        for (const [key, prop] of Object.entries(tool.props)) {
            parameters.properties![key] = {
                type: prop.type ?? 'string',
                description: prop.desc,
            };

            if (prop.required) {
                parameters.required!.push(key);
            }
        }

        if (parameters.required!.length === 0) delete parameters.required; // optional cleanup
        cookedTool.function.parameters = parameters;
    }

    tools.push(cookedTool);
    functions[tool.name] = tool.func;
}