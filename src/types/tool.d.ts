export interface LLMToolParameter {
    type: string;
    description?: string;
    properties?: Record<string, LLMToolParameter>;
    required?: string[];
}

export interface LLMToolFunction {
    name: string;
    description?: string;
    parameters?: LLMToolParameter;
}

export interface LLMToolSchema {
    type: 'function';
    function: LLMToolFunction;
}

export type FunctionAny = (args: Record<string, any>) => any | Promise<any>;

export interface AddToolProps {
    func: FunctionAny;
    name: string;
    desc: string;
    props?: Record<
        string,
        {
            type?: string;
            desc?: string;
            required?: boolean;
        }
    >;
}