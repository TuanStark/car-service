import { Injectable } from "@nestjs/common";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadEnv } from "@/common/config/env.config";
import {
  extractActionsAndCleanText,
  type ILlmProvider,
  type LlmTurnRequest,
  type LlmTurnResponse,
} from "./llm-provider.interface";

const execFileAsync = promisify(execFile);

@Injectable()
export class AgyCliProvider implements ILlmProvider {
  readonly name = "agy-cli";

  isAvailable(): boolean {
    const env = loadEnv();
    return env.NODE_ENV !== "production" && env.AGY_CLI_ENABLED;
  }

  async generateTurn(request: LlmTurnRequest): Promise<LlmTurnResponse> {
    const env = loadEnv();

    const conversationTranscript = request.messages
      .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join("\n");

    const prompt = [
      request.systemPrompt,
      "",
      "Available Tools (you may return JSON inside ```json { \"toolCalls\": [...], \"actions\": [...] } ``` if needed):",
      JSON.stringify(request.tools.map((t) => ({ name: t.name, description: t.description }))),
      "",
      "Conversation:",
      conversationTranscript,
    ].join("\n");

    const { stdout } = await execFileAsync(
      env.AGY_CLI_BIN,
      [
        "--print",
        prompt,
        "--output-format",
        "json",
        "--disable-slash-commands",
      ],
      {
        timeout: env.AGY_CLI_TIMEOUT_MS,
        maxBuffer: 1024 * 1024,
      }
    );

    let rawText = stdout.trim();
    try {
      const parsed = JSON.parse(rawText) as { result?: string; text?: string };
      rawText = parsed.result ?? parsed.text ?? rawText;
    } catch {
      // Keep raw stdout if plain text
    }

    const { cleanText, actions } = extractActionsAndCleanText(rawText);

    return {
      provider: this.name,
      text: cleanText,
      toolCalls: [],
      proposedActions: actions,
    };
  }
}
