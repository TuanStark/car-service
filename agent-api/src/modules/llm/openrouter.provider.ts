import { Injectable } from "@nestjs/common";
import { loadEnv } from "@/common/config/env.config";
import {
  extractActionsAndCleanText,
  type ILlmProvider,
  type LlmToolCall,
  type LlmTurnRequest,
  type LlmTurnResponse,
  LlmQuotaError,
} from "./llm-provider.interface";

@Injectable()
export class OpenRouterProvider implements ILlmProvider {
  readonly name = "openrouter";

  isAvailable(): boolean {
    const env = loadEnv();
    return Boolean(env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 0);
  }

  async generateTurn(request: LlmTurnRequest): Promise<LlmTurnResponse> {
    const env = loadEnv();
    if (!env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured.");
    }

    const openAiMessages = [
      { role: "system", content: request.systemPrompt },
      ...request.messages.map((m) =>
        m.role === "tool"
          ? {
              role: "tool",
              tool_call_id: m.toolCallId ?? "tool_call",
              content: m.content,
            }
          : { role: m.role, content: m.content }
      ),
    ];

    const openAiTools = request.tools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parametersSchema,
      },
    }));

    const res = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://autora.vn",
        "X-Title": "AUTORA Agent Platform",
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL,
        messages: openAiMessages,
        tools: openAiTools.length > 0 ? openAiTools : undefined,
        tool_choice: openAiTools.length > 0 ? "auto" : undefined,
        temperature: 0.3,
      }),
    });

    if (res.status === 429) {
      throw new LlmQuotaError(this.name, await res.text());
    }

    if (!res.ok) {
      throw new Error(`OpenRouter HTTP ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{
            id: string;
            function: { name: string; arguments: string };
          }>;
        };
      }>;
    };

    const msg = data.choices?.[0]?.message;
    const rawToolCalls = msg?.tool_calls ?? [];
    const toolCalls: LlmToolCall[] = rawToolCalls.map((tc) => {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(tc.function.arguments || "{}");
      } catch {
        parsedArgs = {};
      }
      return {
        id: tc.id,
        name: tc.function.name,
        arguments: parsedArgs,
      };
    });

    const { cleanText, actions } = extractActionsAndCleanText(
      msg?.content ?? ""
    );

    return {
      provider: this.name,
      text: cleanText,
      toolCalls,
      proposedActions: actions,
    };
  }
}
