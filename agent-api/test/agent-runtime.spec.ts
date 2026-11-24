import { describe, it, expect, beforeEach } from "vitest";
import { AuditService } from "@/modules/audit/audit.service";
import { TenantRegistryService } from "@/modules/tenants/tenant-registry.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { RagService } from "@/modules/rag/rag.service";
import { MockAutoraConnector } from "@/modules/connectors/mock-autora.connector";
import { ToolRegistryService } from "@/modules/tools/tool-registry.service";
import { OpenRouterProvider } from "@/modules/llm/openrouter.provider";
import { GeminiApiProvider } from "@/modules/llm/gemini.provider";
import { AgyCliProvider } from "@/modules/llm/agy-cli.provider";
import { LocalFallbackProvider } from "@/modules/llm/local-fallback.provider";
import { LlmRouterService } from "@/modules/llm/llm-router.service";
import { LlmQuotaError } from "@/modules/llm/llm-provider.interface";
import { SessionsService } from "@/modules/sessions/sessions.service";
import { AgentRuntimeService } from "@/modules/runtime/agent-runtime.service";

describe("AgentRuntimeService & LlmRouterService (Phase 1)", () => {
  let sessionsService: SessionsService;
  let runtimeService: AgentRuntimeService;
  let auditService: AuditService;

  beforeEach(() => {
    process.env.LLM_PROVIDER = "mock";
    auditService = new AuditService();
    const tenantRegistry = new TenantRegistryService();
    const rbacService = new RbacService();
    const ragService = new RagService(rbacService);
    const connector = new MockAutoraConnector();
    const toolRegistry = new ToolRegistryService(
      rbacService,
      auditService,
      connector
    );

    const llmRouter = new LlmRouterService(
      new OpenRouterProvider(),
      new GeminiApiProvider(),
      new AgyCliProvider(),
      new LocalFallbackProvider()
    );

    sessionsService = new SessionsService(tenantRegistry, auditService);
    runtimeService = new AgentRuntimeService(
      sessionsService,
      tenantRegistry,
      rbacService,
      ragService,
      toolRegistry,
      llmRouter,
      auditService
    );
  });

  it("processes garage search intent, executes tool, returns cards & validated actions", async () => {
    const session = sessionsService.createSession({
      tenantId: "autora-vn",
      actorRole: "guest",
    });

    const result = await runtimeService.processUserMessage({
      sessionId: session.id,
      userMessage: "Tôi muốn tìm garage uy tín ở Quận 7",
      context: { current_page: "/" },
    });

    expect(result.message).toContain("SAIGON MOTORWERKS");
    expect(result.cards.length).toBeGreaterThan(0);
    expect(result.cards[0].kind).toBe("garage");
    expect(result.actions.some((a) => a.target === "garage.show")).toBe(true);
    expect(
      auditService.listBySession(session.id).some((e) => e.eventType === "tool.executed")
    ).toBe(true);
  });

  it("prepares booking draft (L3) with requiresConfirmation=true and never auto-confirms", async () => {
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

    const draftAction = result.actions.find(
      (a) => a.target === "booking.fill_draft"
    );
    expect(draftAction).toBeDefined();
    expect(draftAction?.requiresConfirmation).toBe(true);
  });

  it("falls back cleanly when Gemini API hits quota error", async () => {
    delete process.env.LLM_PROVIDER;
    process.env.NODE_ENV = "development";

    const fakeGemini = {
      name: "gemini",
      isAvailable: () => true,
      generateTurn: async () => {
        throw new LlmQuotaError("gemini", "429 RESOURCE_EXHAUSTED");
      },
    } as unknown as GeminiApiProvider;

    const disabledAgy = {
      name: "agy-cli",
      isAvailable: () => false,
      generateTurn: async () => {
        throw new Error("unused");
      },
    } as unknown as AgyCliProvider;

    const router = new LlmRouterService(
      new OpenRouterProvider(),
      fakeGemini,
      disabledAgy,
      new LocalFallbackProvider()
    );

    const turn = await router.generateTurn({
      systemPrompt: "test",
      messages: [{ role: "user", content: "Tìm gara Quận 7" }],
      tools: [],
    });

    expect(turn.provider).toBe("local-advisor");
    expect(turn.toolCalls[0].name).toBe("search_garages");
  });
});
