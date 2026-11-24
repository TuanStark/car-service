"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const audit_service_1 = require("../src/modules/audit/audit.service");
const tenant_registry_service_1 = require("../src/modules/tenants/tenant-registry.service");
const rbac_service_1 = require("../src/modules/rbac/rbac.service");
const rag_service_1 = require("../src/modules/rag/rag.service");
const mock_autora_connector_1 = require("../src/modules/connectors/mock-autora.connector");
const tool_registry_service_1 = require("../src/modules/tools/tool-registry.service");
const openrouter_provider_1 = require("../src/modules/llm/openrouter.provider");
const gemini_provider_1 = require("../src/modules/llm/gemini.provider");
const agy_cli_provider_1 = require("../src/modules/llm/agy-cli.provider");
const local_fallback_provider_1 = require("../src/modules/llm/local-fallback.provider");
const llm_router_service_1 = require("../src/modules/llm/llm-router.service");
const llm_provider_interface_1 = require("../src/modules/llm/llm-provider.interface");
const sessions_service_1 = require("../src/modules/sessions/sessions.service");
const agent_runtime_service_1 = require("../src/modules/runtime/agent-runtime.service");
(0, vitest_1.describe)("AgentRuntimeService & LlmRouterService (Phase 1)", () => {
    let sessionsService;
    let runtimeService;
    let auditService;
    (0, vitest_1.beforeEach)(() => {
        process.env.LLM_PROVIDER = "mock";
        auditService = new audit_service_1.AuditService();
        const tenantRegistry = new tenant_registry_service_1.TenantRegistryService();
        const rbacService = new rbac_service_1.RbacService();
        const ragService = new rag_service_1.RagService(rbacService);
        const connector = new mock_autora_connector_1.MockAutoraConnector();
        const toolRegistry = new tool_registry_service_1.ToolRegistryService(rbacService, auditService, connector);
        const llmRouter = new llm_router_service_1.LlmRouterService(new openrouter_provider_1.OpenRouterProvider(), new gemini_provider_1.GeminiApiProvider(), new agy_cli_provider_1.AgyCliProvider(), new local_fallback_provider_1.LocalFallbackProvider());
        sessionsService = new sessions_service_1.SessionsService(tenantRegistry, auditService);
        runtimeService = new agent_runtime_service_1.AgentRuntimeService(sessionsService, tenantRegistry, rbacService, ragService, toolRegistry, llmRouter, auditService);
    });
    (0, vitest_1.it)("processes garage search intent, executes tool, returns cards & validated actions", async () => {
        const session = sessionsService.createSession({
            tenantId: "autora-vn",
            actorRole: "guest",
        });
        const result = await runtimeService.processUserMessage({
            sessionId: session.id,
            userMessage: "Tôi muốn tìm garage uy tín ở Quận 7",
            context: { current_page: "/" },
        });
        (0, vitest_1.expect)(result.message).toContain("SAIGON MOTORWERKS");
        (0, vitest_1.expect)(result.cards.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.cards[0].kind).toBe("garage");
        (0, vitest_1.expect)(result.actions.some((a) => a.target === "garage.show")).toBe(true);
        (0, vitest_1.expect)(auditService.listBySession(session.id).some((e) => e.eventType === "tool.executed")).toBe(true);
    });
    (0, vitest_1.it)("prepares booking draft (L3) with requiresConfirmation=true and never auto-confirms", async () => {
        const session = sessionsService.createSession({
            tenantId: "autora-vn",
            actorRole: "customer",
            actorUserId: "usr_khoa_01",
        });
        const result = await runtimeService.processUserMessage({
            sessionId: session.id,
            userMessage: "Giúp tôi đặt lịch thay dầu nhớt",
            context: {
                current_page: "/dich-vu",
                vehicle: { brand: "Mazda", model: "CX-5" },
            },
        });
        const draftAction = result.actions.find((a) => a.target === "booking.fill_draft");
        (0, vitest_1.expect)(draftAction).toBeDefined();
        (0, vitest_1.expect)(draftAction?.requiresConfirmation).toBe(true);
    });
    (0, vitest_1.it)("falls back cleanly when Gemini API hits quota error", async () => {
        delete process.env.LLM_PROVIDER;
        process.env.NODE_ENV = "development";
        const fakeGemini = {
            name: "gemini",
            isAvailable: () => true,
            generateTurn: async () => {
                throw new llm_provider_interface_1.LlmQuotaError("gemini", "429 RESOURCE_EXHAUSTED");
            },
        };
        const disabledAgy = {
            name: "agy-cli",
            isAvailable: () => false,
            generateTurn: async () => {
                throw new Error("unused");
            },
        };
        const router = new llm_router_service_1.LlmRouterService(new openrouter_provider_1.OpenRouterProvider(), fakeGemini, disabledAgy, new local_fallback_provider_1.LocalFallbackProvider());
        const turn = await router.generateTurn({
            systemPrompt: "test",
            messages: [{ role: "user", content: "Tìm gara Quận 7" }],
            tools: [],
        });
        (0, vitest_1.expect)(turn.provider).toBe("local-advisor");
        (0, vitest_1.expect)(turn.toolCalls[0].name).toBe("search_garages");
    });
});
//# sourceMappingURL=agent-runtime.spec.js.map