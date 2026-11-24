"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiApiProvider = void 0;
const common_1 = require("@nestjs/common");
const env_config_1 = require("../../common/config/env.config");
const llm_provider_interface_1 = require("./llm-provider.interface");
let GeminiApiProvider = class GeminiApiProvider {
    name = "gemini";
    isAvailable() {
        const env = (0, env_config_1.loadEnv)();
        return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0);
    }
    async generateTurn(request) {
        const env = (0, env_config_1.loadEnv)();
        if (!env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not configured.");
        }
        const contents = request.messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [
                {
                    text: m.role === "tool"
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
                tools: functionDeclarations.length > 0
                    ? [{ functionDeclarations }]
                    : undefined,
                generationConfig: {
                    temperature: 0.3,
                },
            }),
        });
        if (res.status === 429 || res.status === 403) {
            throw new llm_provider_interface_1.LlmQuotaError(this.name, await res.text());
        }
        if (!res.ok) {
            throw new Error(`Gemini API HTTP ${res.status}: ${await res.text()}`);
        }
        const data = (await res.json());
        const parts = data.candidates?.[0]?.content?.parts ?? [];
        const textParts = [];
        const toolCalls = [];
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
        const { cleanText, actions } = (0, llm_provider_interface_1.extractActionsAndCleanText)(textParts.join("\n"));
        return {
            provider: this.name,
            text: cleanText,
            toolCalls,
            proposedActions: actions,
        };
    }
};
exports.GeminiApiProvider = GeminiApiProvider;
exports.GeminiApiProvider = GeminiApiProvider = __decorate([
    (0, common_1.Injectable)()
], GeminiApiProvider);
//# sourceMappingURL=gemini.provider.js.map