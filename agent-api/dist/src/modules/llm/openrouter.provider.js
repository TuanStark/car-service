"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterProvider = void 0;
const common_1 = require("@nestjs/common");
const env_config_1 = require("../../common/config/env.config");
const llm_provider_interface_1 = require("./llm-provider.interface");
let OpenRouterProvider = class OpenRouterProvider {
    name = "openrouter";
    isAvailable() {
        const env = (0, env_config_1.loadEnv)();
        return Boolean(env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 0);
    }
    async generateTurn(request) {
        const env = (0, env_config_1.loadEnv)();
        if (!env.OPENROUTER_API_KEY) {
            throw new Error("OPENROUTER_API_KEY is not configured.");
        }
        const openAiMessages = [
            { role: "system", content: request.systemPrompt },
            ...request.messages.map((m) => m.role === "tool"
                ? {
                    role: "tool",
                    tool_call_id: m.toolCallId ?? "tool_call",
                    content: m.content,
                }
                : { role: m.role, content: m.content }),
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
            throw new llm_provider_interface_1.LlmQuotaError(this.name, await res.text());
        }
        if (!res.ok) {
            throw new Error(`OpenRouter HTTP ${res.status}: ${await res.text()}`);
        }
        const data = (await res.json());
        const msg = data.choices?.[0]?.message;
        const rawToolCalls = msg?.tool_calls ?? [];
        const toolCalls = rawToolCalls.map((tc) => {
            let parsedArgs = {};
            try {
                parsedArgs = JSON.parse(tc.function.arguments || "{}");
            }
            catch {
                parsedArgs = {};
            }
            return {
                id: tc.id,
                name: tc.function.name,
                arguments: parsedArgs,
            };
        });
        const { cleanText, actions } = (0, llm_provider_interface_1.extractActionsAndCleanText)(msg?.content ?? "");
        return {
            provider: this.name,
            text: cleanText,
            toolCalls,
            proposedActions: actions,
        };
    }
};
exports.OpenRouterProvider = OpenRouterProvider;
exports.OpenRouterProvider = OpenRouterProvider = __decorate([
    (0, common_1.Injectable)()
], OpenRouterProvider);
//# sourceMappingURL=openrouter.provider.js.map