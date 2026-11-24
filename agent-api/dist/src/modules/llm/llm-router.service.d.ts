import { type LlmTurnRequest, type LlmTurnResponse } from "./llm-provider.interface";
import { OpenRouterProvider } from "./openrouter.provider";
import { GeminiApiProvider } from "./gemini.provider";
import { AgyCliProvider } from "./agy-cli.provider";
import { LocalFallbackProvider } from "./local-fallback.provider";
export declare class LlmRouterService {
    private readonly openRouter;
    private readonly gemini;
    private readonly agyCli;
    private readonly localFallback;
    private readonly logger;
    constructor(openRouter: OpenRouterProvider, gemini: GeminiApiProvider, agyCli: AgyCliProvider, localFallback: LocalFallbackProvider);
    private getProviderChain;
    generateTurn(request: LlmTurnRequest): Promise<LlmTurnResponse>;
}
