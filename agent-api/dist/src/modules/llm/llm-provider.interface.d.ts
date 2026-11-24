export interface LlmToolCall {
    readonly id: string;
    readonly name: string;
    readonly arguments: Record<string, unknown>;
}
export interface LlmChatMessage {
    readonly role: "system" | "user" | "assistant" | "tool";
    readonly content: string;
    readonly toolName?: string;
    readonly toolCallId?: string;
}
export interface LlmToolDefinition {
    readonly name: string;
    readonly description: string;
    readonly parametersSchema: Record<string, unknown>;
}
export interface LlmTurnRequest {
    readonly systemPrompt: string;
    readonly messages: readonly LlmChatMessage[];
    readonly tools: readonly LlmToolDefinition[];
}
export interface LlmTurnResponse {
    readonly provider: string;
    readonly text: string;
    readonly toolCalls: readonly LlmToolCall[];
    readonly proposedActions: readonly unknown[];
}
export interface ILlmProvider {
    readonly name: string;
    isAvailable(): boolean;
    generateTurn(request: LlmTurnRequest): Promise<LlmTurnResponse>;
}
export declare class LlmQuotaError extends Error {
    constructor(provider: string, detail: string);
}
export declare function extractActionsAndCleanText(rawText: string): {
    cleanText: string;
    actions: unknown[];
};
