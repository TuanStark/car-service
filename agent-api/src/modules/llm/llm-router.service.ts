import { Injectable, Logger } from "@nestjs/common";
import { loadEnv } from "@/common/config/env.config";
import {
  type ILlmProvider,
  type LlmTurnRequest,
  type LlmTurnResponse,
  LlmQuotaError,
} from "./llm-provider.interface";
import { OpenRouterProvider } from "./openrouter.provider";
import { GeminiApiProvider } from "./gemini.provider";
import { AgyCliProvider } from "./agy-cli.provider";
import { LocalFallbackProvider } from "./local-fallback.provider";

@Injectable()
export class LlmRouterService {
  private readonly logger = new Logger(LlmRouterService.name);

  constructor(
    private readonly openRouter: OpenRouterProvider,
    private readonly gemini: GeminiApiProvider,
    private readonly agyCli: AgyCliProvider,
    private readonly localFallback: LocalFallbackProvider
  ) {}

  /**
   * Resolves ordered provider chain:
   * - Production: OpenRouter -> LocalFallback
   * - Development (auto): Gemini API -> AGY CLI (on quota/error) -> LocalFallback
   * - Explicit override via LLM_PROVIDER env var
   */
  private getProviderChain(): readonly ILlmProvider[] {
    const env = loadEnv();

    if (env.LLM_PROVIDER === "mock") {
      return [this.localFallback];
    }
    if (env.LLM_PROVIDER === "openrouter") {
      return [this.openRouter, this.localFallback];
    }
    if (env.LLM_PROVIDER === "gemini") {
      return [this.gemini, this.agyCli, this.localFallback];
    }
    if (env.LLM_PROVIDER === "agy") {
      return [this.agyCli, this.localFallback];
    }

    if (env.NODE_ENV === "production") {
      return [this.openRouter, this.localFallback];
    }

    // Development default: Gemini API -> AGY CLI -> LocalFallback
    return [this.gemini, this.agyCli, this.localFallback];
  }

  async generateTurn(request: LlmTurnRequest): Promise<LlmTurnResponse> {
    const chain = this.getProviderChain();
    const errors: string[] = [];

    for (const provider of chain) {
      if (!provider.isAvailable()) {
        continue;
      }

      try {
        return await provider.generateTurn(request);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${provider.name}: ${msg}`);
        if (err instanceof LlmQuotaError) {
          this.logger.warn(
            `Provider "${provider.name}" hit quota limit, falling back to next provider...`
          );
        } else {
          this.logger.warn(
            `Provider "${provider.name}" failed (${msg}), falling back...`
          );
        }
      }
    }

    this.logger.error(`All LLM providers failed: ${errors.join(" | ")}`);
    return this.localFallback.generateTurn(request);
  }
}
