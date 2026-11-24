import type { AgentAction, PageContext, UiCard } from "../../common/contracts/agent.contract";
import { AuditService } from "../audit/audit.service";
import { RbacService } from "../rbac/rbac.service";
import { RagService } from "../rag/rag.service";
import { TenantRegistryService } from "../tenants/tenant-registry.service";
import { ToolRegistryService } from "../tools/tool-registry.service";
import { LlmRouterService } from "../llm/llm-router.service";
import { SessionsService } from "../sessions/sessions.service";
export interface AgentTurnResult {
    readonly messageId: string;
    readonly message: string;
    readonly cards: readonly UiCard[];
    readonly actions: readonly AgentAction[];
    readonly provider: string;
    readonly latencyMs: number;
}
export declare class AgentRuntimeService {
    private readonly sessionsService;
    private readonly tenantRegistry;
    private readonly rbacService;
    private readonly ragService;
    private readonly toolRegistry;
    private readonly llmRouter;
    private readonly auditService;
    constructor(sessionsService: SessionsService, tenantRegistry: TenantRegistryService, rbacService: RbacService, ragService: RagService, toolRegistry: ToolRegistryService, llmRouter: LlmRouterService, auditService: AuditService);
    private buildSystemPrompt;
    private getAllowedToolsForActor;
    private extractCardsFromToolResult;
    processUserMessage(params: {
        sessionId: string;
        userMessage: string;
        context?: PageContext;
        onStreamEvent?: (event: {
            type: string;
            [key: string]: unknown;
        }) => void;
    }): Promise<AgentTurnResult>;
}
