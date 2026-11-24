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
export class GeminiApiProvider implements ILlmProvider {
  readonly name = "gemini";

  isAvailable(): boolean {
    const env = loadEnv();
    return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0);
  }

  async generateTurn(request: LlmTurnRequest): Promise<LlmTurnResponse> {
    const env = loadEnv();
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const contents = request.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [
        {
          text:
            m.role === "tool"
              ? `[ToolResult:${m.toolName ?? "tool"}] ${m.content}`
              : m.content,
        },
      ],
    }));

    const functionDeclarations = request.tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parametersSchema,
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: request.systemPrompt }],
        },
        contents,
        tools:
          functionDeclarations.length > 0
            ? [{ functionDeclarations }]
            : undefined,
        generationConfig: {
          temperature: 0.3,
        },
      }),
    });

    if (res.status === 429 || res.status === 403) {
      throw new LlmQuotaError(this.name, await res.text());
    }

    if (!res.ok) {
      throw new Error(`Gemini API HTTP ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
            functionCall?: { name: string; args?: Record<string, unknown> };
          }>;
        };
      }>;
    };

    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const textParts: string[] = [];
    const toolCalls: LlmToolCall[] = [];

    parts.forEach((part, idx) => {
      if (part.text) {
        textParts.push(part.text);
      }
      if (part.functionCall) {
        toolCalls.push({
          id: `gem_tc_${Date.now()}_${idx}`,
          name: part.functionCall.name,
          arguments: part.functionCall.args ?? {},
        });
      }
    });

    const { cleanText, actions } = extractActionsAndCleanText(
      textParts.join("\n")
    );

    return {
      provider: this.name,
      text: cleanText,
      toolCalls,
      proposedActions: actions,
    };
  }
}
