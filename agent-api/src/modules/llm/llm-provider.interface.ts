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
  toolCalls: LlmToolCall[];
} {
  const jsonBlockMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1]) as {
        actions?: unknown[];
        toolCalls?: Array<{ name?: string; arguments?: Record<string, unknown> }>;
      };
      const actions = Array.isArray(parsed?.actions)
        ? parsed.actions.map((item) => {
            if (item && typeof item === "object") {
              const rec = item as Record<string, unknown>;
              return {
                type: typeof rec.type === "string" ? rec.type : "navigate",
                label:
                  typeof rec.label === "string" && rec.label.trim()
                    ? rec.label
                    : typeof rec.target === "string"
                    ? `Đi tới ${rec.target}`
                    : "Thực hiện",
                ...rec,
              };
            }
            return item;
          })
        : [];
      const toolCalls: LlmToolCall[] = Array.isArray(parsed?.toolCalls)
        ? parsed.toolCalls
            .filter((tc) => typeof tc?.name === "string" && tc.name.trim().length > 0)
            .map((tc, idx) => ({
              id: `cli_tc_${Date.now()}_${idx}`,
              name: tc.name as string,
              arguments:
                tc.arguments && typeof tc.arguments === "object"
                  ? tc.arguments
                  : {},
            }))
        : [];
      const cleanText = rawText.replace(jsonBlockMatch[0], "").trim();
      return { cleanText, actions, toolCalls };
    } catch {
      // Ignore malformed JSON block
    }
  }
  return { cleanText: rawText.trim(), actions: [], toolCalls: [] };
}

