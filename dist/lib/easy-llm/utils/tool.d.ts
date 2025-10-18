import { AddToolProps, FunctionAny, LLMToolSchema } from "../../../types";
export declare function toolRegister({ tools, functions, tool }: {
    tools: LLMToolSchema[];
    functions: Record<string, FunctionAny>;
    tool: AddToolProps;
}): void;
