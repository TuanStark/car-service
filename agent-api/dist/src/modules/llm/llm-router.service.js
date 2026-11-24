"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LlmRouterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmRouterService = void 0;
const common_1 = require("@nestjs/common");
const env_config_1 = require("../../common/config/env.config");
const llm_provider_interface_1 = require("./llm-provider.interface");
const openrouter_provider_1 = require("./openrouter.provider");
const gemini_provider_1 = require("./gemini.provider");
const agy_cli_provider_1 = require("./agy-cli.provider");
const local_fallback_provider_1 = require("./local-fallback.provider");
let LlmRouterService = LlmRouterService_1 = class LlmRouterService {
    openRouter;
    gemini;
    agyCli;
    localFallback;
    logger = new common_1.Logger(LlmRouterService_1.name);
    constructor(openRouter, gemini, agyCli, localFallback) {
        this.openRouter = openRouter;
        this.gemini = gemini;
        this.agyCli = agyCli;
        this.localFallback = localFallback;
    }
    getProviderChain() {
        const env = (0, env_config_1.loadEnv)();
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
        return [this.gemini, this.agyCli, this.localFallback];
    }
    async generateTurn(request) {
        const chain = this.getProviderChain();
        const errors = [];
        for (const provider of chain) {
            if (!provider.isAvailable()) {
                continue;
            }
            try {
                return await provider.generateTurn(request);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                errors.push(`${provider.name}: ${msg}`);
                if (err instanceof llm_provider_interface_1.LlmQuotaError) {
                    this.logger.warn(`Provider "${provider.name}" hit quota limit, falling back to next provider...`);
                }
                else {
                    this.logger.warn(`Provider "${provider.name}" failed (${msg}), falling back...`);
                }
            }
        }
        this.logger.error(`All LLM providers failed: ${errors.join(" | ")}`);
        return this.localFallback.generateTurn(request);
    }
};
exports.LlmRouterService = LlmRouterService;
exports.LlmRouterService = LlmRouterService = LlmRouterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [openrouter_provider_1.OpenRouterProvider,
        gemini_provider_1.GeminiApiProvider,
        agy_cli_provider_1.AgyCliProvider,
        local_fallback_provider_1.LocalFallbackProvider])
], LlmRouterService);
//# sourceMappingURL=llm-router.service.js.map