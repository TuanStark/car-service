import type { ILlmProvider, LlmTurnRequest, LlmTurnResponse } from "./llm-provider.interface";
export declare class LocalFallbackProvider implements ILlmProvider {
    readonly name = "local-advisor";
    isAvailable(): boolean;
    generateTurn(request: LlmTurnRequest): Promise<LlmTurnResponse>;
}
