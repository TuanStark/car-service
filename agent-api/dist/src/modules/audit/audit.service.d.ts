import type { ActorRole } from "../../common/contracts/agent.contract";
export interface AuditEventInput {
    readonly tenantId: string;
    readonly sessionId?: string;
    readonly actorRole: ActorRole;
    readonly actorUserId?: string;
    readonly eventType: "session.created" | "message.processed" | "tool.executed" | "tool.denied" | "action.proposed" | "action.rejected" | "rate_limit.exceeded";
    readonly toolName?: string;
    readonly actionTarget?: string;
    readonly allowed: boolean;
    readonly reason?: string;
    readonly latencyMs?: number;
    readonly provider?: string;
}
export interface AuditRecord extends AuditEventInput {
    readonly id: string;
    readonly createdAt: string;
}
export declare class AuditService {
    private readonly logger;
    private readonly records;
    private seq;
    record(event: AuditEventInput): AuditRecord;
    listBySession(sessionId: string): readonly AuditRecord[];
    listRecent(limit?: number): readonly AuditRecord[];
}
