"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolRegister = toolRegister;
function toolRegister({ tools, functions, tool, }) {
    const cookedTool = {
        type: 'function',
        function: {
            name: tool.name,
            description: tool.desc,
        },
    };
    if (tool.props && Object.keys(tool.props).length > 0) {
        const parameters = {
            type: 'object',
            properties: {},
            required: [],
        };
        for (const [key, prop] of Object.entries(tool.props)) {
            parameters.properties[key] = {
                type: prop.type ?? 'string',
                description: prop.desc,
            };
            if (prop.required) {
                parameters.required.push(key);
            }
        }
        if (parameters.required.length === 0)
            delete parameters.required; // optional cleanup
        cookedTool.function.parameters = parameters;
    }
    const index = tools.findIndex(x => x.function.name === cookedTool.function.name);
    if (tools[index])
        tools[index] = cookedTool;
    else
        tools.push(cookedTool);
    functions[tool.name] = {
        func: tool.func,
        type: tool.type
    };
}
