import { type Observable } from "rxjs";
import type { ActorRole, AgentAction, SseEventPayload, TrustedActorContext, UiCard } from "../../common/contracts/agent.contract";
import { AuditService } from "../audit/audit.service";
import { TenantRegistryService } from "../tenants/tenant-registry.service";
export interface StoredMessage {
    readonly id: string;
    readonly role: "user" | "assistant";
    readonly content: string;
    readonly cards?: readonly UiCard[];
    readonly actions?: readonly AgentAction[];
    readonly provider?: string;
    readonly latencyMs?: number;
    readonly createdAt: string;
}
export interface SessionRecord {
    readonly id: string;
    readonly actor: TrustedActorContext;
    readonly metadata?: Record<string, string>;
    readonly createdAt: string;
    readonly expiresAt: string;
    readonly messages: StoredMessage[];
}
export declare class SessionsService {
    private readonly tenantRegistry;
    private readonly auditService;
    private readonly sessions;
    private readonly streams;
    constructor(tenantRegistry: TenantRegistryService, auditService: AuditService);
    createSession(input: {
        tenantId: string;
        actorRole?: ActorRole;
        actorUserId?: string;
        metadata?: Record<string, string>;
    }): SessionRecord;
    getSession(sessionId: string): SessionRecord;
    appendMessage(sessionId: string, msg: StoredMessage): void;
    emitEvent(sessionId: string, payload: SseEventPayload): void;
    getEventStream(sessionId: string): Observable<SseEventPayload>;
}
