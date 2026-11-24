"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmQuotaError = void 0;
exports.extractActionsAndCleanText = extractActionsAndCleanText;
class LlmQuotaError extends Error {
    constructor(provider, detail) {
        super(`[${provider}] Quota or rate limit reached: ${detail}`);
        this.name = "LlmQuotaError";
    }
}
exports.LlmQuotaError = LlmQuotaError;
function extractActionsAndCleanText(rawText) {
    const jsonBlockMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch) {
        try {
            const parsed = JSON.parse(jsonBlockMatch[1]);
            const actions = Array.isArray(parsed?.actions) ? parsed.actions : [];
            const cleanText = rawText.replace(jsonBlockMatch[0], "").trim();
            return { cleanText, actions };
        }
        catch {
        }
    }
    return { cleanText: rawText.trim(), actions: [] };
}
//# sourceMappingURL=llm-provider.interface.js.map