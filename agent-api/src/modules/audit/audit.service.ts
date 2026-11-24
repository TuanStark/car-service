import { Injectable, Logger } from "@nestjs/common";
import type { ActorRole } from "@/common/contracts/agent.contract";

export interface AuditEventInput {
  readonly tenantId: string;
  readonly sessionId?: string;
  readonly actorRole: ActorRole;
  readonly actorUserId?: string;
  readonly eventType:
    | "session.created"
    | "message.processed"
    | "tool.executed"
    | "tool.denied"
    | "action.proposed"
    | "action.rejected"
    | "rate_limit.exceeded";
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

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly records: AuditRecord[] = [];
  private seq = 1;

  record(event: AuditEventInput): AuditRecord {
    const entry: AuditRecord = {
      ...event,
      id: `aud_${this.seq++}`,
      createdAt: new Date().toISOString(),
    };

    this.records.push(entry);
    if (this.records.length > 2000) {
      this.records.shift();
    }

    const logPayload = {
      auditId: entry.id,
      tenantId: entry.tenantId,
      sessionId: entry.sessionId,
      actorRole: entry.actorRole,
      eventType: entry.eventType,
      toolName: entry.toolName,
      actionTarget: entry.actionTarget,
      allowed: entry.allowed,
      provider: entry.provider,
      latencyMs: entry.latencyMs,
      reason: entry.reason,
    };

    if (!entry.allowed) {
      this.logger.warn(JSON.stringify(logPayload));
    } else {
      this.logger.log(JSON.stringify(logPayload));
    }

    return entry;
  }

  listBySession(sessionId: string): readonly AuditRecord[] {
    return this.records.filter((r) => r.sessionId === sessionId);
  }

  listRecent(limit = 50): readonly AuditRecord[] {
    return this.records.slice(-limit);
  }
}
