import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Subject, type Observable } from "rxjs";
import type {
  ActorRole,
  AgentAction,
  SseEventPayload,
  TrustedActorContext,
  UiCard,
} from "@/common/contracts/agent.contract";
import { AuditService } from "@/modules/audit/audit.service";
import { TenantRegistryService } from "@/modules/tenants/tenant-registry.service";

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

@Injectable()
export class SessionsService {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly streams = new Map<string, Subject<SseEventPayload>>();

  constructor(
    private readonly tenantRegistry: TenantRegistryService,
    private readonly auditService: AuditService
  ) {}

  createSession(input: {
    tenantId: string;
    actorRole?: ActorRole;
    actorUserId?: string;
    metadata?: Record<string, string>;
  }): SessionRecord {
    // Validate tenant exists
    this.tenantRegistry.getManifest(input.tenantId);

    const role: ActorRole = input.actorRole ?? "guest";
    // Prevent impersonation: customer role without userId downgrades safely to guest
    const effectiveRole: ActorRole =
      role === "customer" && !input.actorUserId ? "guest" : role;

    const now = new Date();
    const expires = new Date(now.getTime() + 1000 * 60 * 60 * 4);
    const id = randomUUID();

    const record: SessionRecord = {
      id,
      actor: {
        tenantId: input.tenantId,
        role: effectiveRole,
        userId: effectiveRole === "guest" ? undefined : input.actorUserId,
      },
      metadata: input.metadata,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      messages: [],
    };

    this.sessions.set(id, record);
    this.streams.set(id, new Subject<SseEventPayload>());

    this.auditService.record({
      tenantId: record.actor.tenantId,
      sessionId: id,
      actorRole: record.actor.role,
      actorUserId: record.actor.userId,
      eventType: "session.created",
      allowed: true,
    });

    return record;
  }

  getSession(sessionId: string): SessionRecord {
    const found = this.sessions.get(sessionId);
    if (!found) {
      throw new NotFoundException(`Session "${sessionId}" not found.`);
    }
    return found;
  }

  appendMessage(sessionId: string, msg: StoredMessage): void {
    const session = this.getSession(sessionId);
    session.messages.push(msg);
  }

  emitEvent(sessionId: string, payload: SseEventPayload): void {
    const subject = this.streams.get(sessionId);
    if (subject) {
      subject.next(payload);
    }
  }

  getEventStream(sessionId: string): Observable<SseEventPayload> {
    this.getSession(sessionId);
    let subject = this.streams.get(sessionId);
    if (!subject) {
      subject = new Subject<SseEventPayload>();
      this.streams.set(sessionId, subject);
    }
    return subject.asObservable();
  }
}

