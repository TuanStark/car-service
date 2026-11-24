import { type ILlmProvider, type LlmTurnRequest, type LlmTurnResponse } from "./llm-provider.interface";
export declare class AgyCliProvider implements ILlmProvider {
    readonly name = "agy-cli";
    isAvailable(): boolean;
    generateTurn(request: LlmTurnRequest): Promise<LlmTurnResponse>;
}
