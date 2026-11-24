"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgyCliProvider = void 0;
const common_1 = require("@nestjs/common");
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const env_config_1 = require("../../common/config/env.config");
const llm_provider_interface_1 = require("./llm-provider.interface");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
let AgyCliProvider = class AgyCliProvider {
    name = "agy-cli";
    isAvailable() {
        const env = (0, env_config_1.loadEnv)();
        return env.NODE_ENV !== "production" && env.AGY_CLI_ENABLED;
    }
    async generateTurn(request) {
        const env = (0, env_config_1.loadEnv)();
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
        const { stdout } = await execFileAsync(env.AGY_CLI_BIN, [
            "--print",
            prompt,
            "--output-format",
            "json",
            "--disable-slash-commands",
        ], {
            timeout: env.AGY_CLI_TIMEOUT_MS,
            maxBuffer: 1024 * 1024,
        });
        let rawText = stdout.trim();
        try {
            const parsed = JSON.parse(rawText);
            rawText = parsed.result ?? parsed.text ?? rawText;
        }
        catch {
        }
        const { cleanText, actions } = (0, llm_provider_interface_1.extractActionsAndCleanText)(rawText);
        return {
            provider: this.name,
            text: cleanText,
            toolCalls: [],
            proposedActions: actions,
        };
    }
};
exports.AgyCliProvider = AgyCliProvider;
exports.AgyCliProvider = AgyCliProvider = __decorate([
    (0, common_1.Injectable)()
], AgyCliProvider);
//# sourceMappingURL=agy-cli.provider.js.map