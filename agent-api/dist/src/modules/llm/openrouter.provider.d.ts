import { type ILlmProvider, type LlmTurnRequest, type LlmTurnResponse } from "./llm-provider.interface";
export declare class OpenRouterProvider implements ILlmProvider {
    readonly name = "openrouter";
    isAvailable(): boolean;
    generateTurn(request: LlmTurnRequest): Promise<LlmTurnResponse>;
}
