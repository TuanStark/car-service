"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("./modules/audit/audit.service");
const tenant_registry_service_1 = require("./modules/tenants/tenant-registry.service");
const rbac_service_1 = require("./modules/rbac/rbac.service");
const rag_service_1 = require("./modules/rag/rag.service");
const mock_autora_connector_1 = require("./modules/connectors/mock-autora.connector");
const tool_registry_service_1 = require("./modules/tools/tool-registry.service");
const openrouter_provider_1 = require("./modules/llm/openrouter.provider");
const gemini_provider_1 = require("./modules/llm/gemini.provider");
const agy_cli_provider_1 = require("./modules/llm/agy-cli.provider");
const local_fallback_provider_1 = require("./modules/llm/local-fallback.provider");
const llm_router_service_1 = require("./modules/llm/llm-router.service");
const sessions_service_1 = require("./modules/sessions/sessions.service");
const agent_runtime_service_1 = require("./modules/runtime/agent-runtime.service");
const sessions_controller_1 = require("./modules/api/sessions.controller");
const health_controller_1 = require("./modules/api/health.controller");
const rate_limit_guard_1 = require("./common/guards/rate-limit.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [sessions_controller_1.SessionsController, health_controller_1.HealthController],
        providers: [
            audit_service_1.AuditService,
            tenant_registry_service_1.TenantRegistryService,
            rbac_service_1.RbacService,
            rag_service_1.RagService,
            mock_autora_connector_1.MockAutoraConnector,
            tool_registry_service_1.ToolRegistryService,
            openrouter_provider_1.OpenRouterProvider,
            gemini_provider_1.GeminiApiProvider,
            agy_cli_provider_1.AgyCliProvider,
            local_fallback_provider_1.LocalFallbackProvider,
            llm_router_service_1.LlmRouterService,
            sessions_service_1.SessionsService,
            agent_runtime_service_1.AgentRuntimeService,
            rate_limit_guard_1.RateLimitGuard,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map