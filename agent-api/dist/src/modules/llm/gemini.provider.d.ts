import { type ILlmProvider, type LlmTurnRequest, type LlmTurnResponse } from "./llm-provider.interface";
export declare class GeminiApiProvider implements ILlmProvider {
    readonly name = "gemini";
    isAvailable(): boolean;
    generateTurn(request: LlmTurnRequest): Promise<LlmTurnResponse>;
}
