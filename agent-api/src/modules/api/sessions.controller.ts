import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  Sse,
  UseGuards,
  BadRequestException,
  type MessageEvent,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateSessionDtoSchema,
  SendMessageDtoSchema,
} from "@/common/contracts/agent.contract";
import { RateLimitGuard } from "@/common/guards/rate-limit.guard";
import { SessionsService } from "@/modules/sessions/sessions.service";
import { AgentRuntimeService } from "@/modules/runtime/agent-runtime.service";

@Controller("v1/sessions")
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly runtimeService: AgentRuntimeService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createSession(@Body() rawBody: unknown) {
    const parsed = CreateSessionDtoSchema.safeParse(rawBody ?? {});
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const session = this.sessionsService.createSession(parsed.data);
    return {
      sessionId: session.id,
      tenantId: session.actor.tenantId,
      actorRole: session.actor.role,
      expiresAt: session.expiresAt,
    };
  }

  @Post(":sessionId/messages")
  @UseGuards(RateLimitGuard)
  async sendMessage(
    @Param("sessionId") sessionId: string,
    @Body() rawBody: unknown,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    const parsed = SendMessageDtoSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const acceptHeader = req.headers.accept ?? "";
    const wantsSse = acceptHeader.includes("text/event-stream");

    if (wantsSse) {
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      });

      const writeSse = (evt: Record<string, unknown>) => {
        reply.raw.write(`event: ${String(evt.type)}\n`);
        reply.raw.write(`data: ${JSON.stringify(evt)}\n\n`);
      };

      await this.runtimeService.processUserMessage({
        sessionId,
        userMessage: parsed.data.message,
        context: parsed.data.context,
        onStreamEvent: writeSse,
      });

      reply.raw.end();
      return;
    }

    return this.runtimeService.processUserMessage({
      sessionId,
      userMessage: parsed.data.message,
      context: parsed.data.context,
    });
  }

  @Sse(":sessionId/events")
  streamEvents(
    @Param("sessionId") sessionId: string
  ): Observable<MessageEvent> {
    return this.sessionsService.getEventStream(sessionId).pipe(
      map((payload) => ({
        type: payload.type,
        data: payload,
      }))
    );
  }
}
