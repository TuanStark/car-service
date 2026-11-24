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

export class LlmQuotaError extends Error {
  constructor(provider: string, detail: string) {
    super(`[${provider}] Quota or rate limit reached: ${detail}`);
    this.name = "LlmQuotaError";
  }
}

/**
 * Extracts structured JSON actions block if the LLM appends ```json { "actions": [...] } ```
 * or returns raw JSON.
 */
export function extractActionsAndCleanText(rawText: string): {
  cleanText: string;
  actions: unknown[];
} {
  const jsonBlockMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1]);
      const actions = Array.isArray(parsed?.actions) ? parsed.actions : [];
      const cleanText = rawText.replace(jsonBlockMatch[0], "").trim();
      return { cleanText, actions };
    } catch {
      // Ignore malformed JSON block
    }
  }
  return { cleanText: rawText.trim(), actions: [] };
}
