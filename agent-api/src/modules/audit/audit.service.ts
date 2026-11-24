import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import type { ActorRole } from "@/common/contracts/agent.contract";
import { PrismaService } from "@/common/prisma/prisma.service";

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
export class AuditService implements OnModuleInit {
  private readonly logger = new Logger(AuditService.name);
  private readonly records: AuditRecord[] = [];
  private seq = 1;

  constructor(private readonly prisma?: PrismaService) {}

  onModuleInit(): void {
    // Ready
  }

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

    if (this.prisma?.isConnected) {
      void this.prisma.auditLog
        .create({
          data: {
            tenantId: event.tenantId,
            sessionId: event.sessionId,
            actorRole: event.actorRole,
            actorUserId: event.actorUserId,
            eventType: event.eventType,
            toolName: event.toolName,
            actionTarget: event.actionTarget,
            allowed: event.allowed,
            reason: event.reason,
            latencyMs: event.latencyMs,
            provider: event.provider,
          },
        })
        .catch(() => {
          // Do not break request flow if audit write fails
        });
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
