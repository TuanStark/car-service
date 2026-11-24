import { Module } from "@nestjs/common";
import { AuditService } from "./modules/audit/audit.service";
import { TenantRegistryService } from "./modules/tenants/tenant-registry.service";
import { RbacService } from "./modules/rbac/rbac.service";
import { RagService } from "./modules/rag/rag.service";
import { MockAutoraConnector } from "./modules/connectors/mock-autora.connector";
import { ToolRegistryService } from "./modules/tools/tool-registry.service";
import { OpenRouterProvider } from "./modules/llm/openrouter.provider";
import { GeminiApiProvider } from "./modules/llm/gemini.provider";
import { AgyCliProvider } from "./modules/llm/agy-cli.provider";
import { LocalFallbackProvider } from "./modules/llm/local-fallback.provider";
import { LlmRouterService } from "./modules/llm/llm-router.service";
import { SessionsService } from "./modules/sessions/sessions.service";
import { AgentRuntimeService } from "./modules/runtime/agent-runtime.service";
import { SessionsController } from "./modules/api/sessions.controller";
import { HealthController } from "./modules/api/health.controller";
import { RateLimitGuard } from "./common/guards/rate-limit.guard";

@Module({
  controllers: [SessionsController, HealthController],
  providers: [
    AuditService,
    TenantRegistryService,
    RbacService,
    RagService,
    MockAutoraConnector,
    ToolRegistryService,
    OpenRouterProvider,
    GeminiApiProvider,
    AgyCliProvider,
    LocalFallbackProvider,
    LlmRouterService,
    SessionsService,
    AgentRuntimeService,
    RateLimitGuard,
  ],
})
export class AppModule {}

