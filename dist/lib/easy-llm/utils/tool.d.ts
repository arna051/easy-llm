import { AddToolProps, FunctionRecord, LLMToolSchema } from '../../../types';
export declare function toolRegister({ tools, functions, tool, }: {
    tools: LLMToolSchema[];
    functions: Record<string, FunctionRecord>;
    tool: AddToolProps;
}): void;
