import { type MessageEvent } from "@nestjs/common";
import { type Observable } from "rxjs";
import type { FastifyReply, FastifyRequest } from "fastify";
import { SessionsService } from "../sessions/sessions.service";
import { AgentRuntimeService } from "../runtime/agent-runtime.service";
export declare class SessionsController {
    private readonly sessionsService;
    private readonly runtimeService;
    constructor(sessionsService: SessionsService, runtimeService: AgentRuntimeService);
    createSession(rawBody: unknown): {
        sessionId: string;
        tenantId: string;
        actorRole: "guest" | "customer" | "partner_staff";
        expiresAt: string;
    };
    sendMessage(sessionId: string, rawBody: unknown, req: FastifyRequest, reply: FastifyReply): Promise<import("@/modules/runtime/agent-runtime.service").AgentTurnResult | undefined>;
    streamEvents(sessionId: string): Observable<MessageEvent>;
}
