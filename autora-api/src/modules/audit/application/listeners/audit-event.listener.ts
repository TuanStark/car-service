import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { RequestContext } from "@core/middlewares/correlation-id.middleware";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { PrismaService } from "@infra/prisma/prisma.service";
import {
  USER_REGISTERED_EVENT,
  type UserRegisteredEvent,
} from "@modules/iam/domain/events/user-registered.event";

@Injectable()
export class AuditEventListener {
  private readonly logger = new Logger(AuditEventListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(USER_REGISTERED_EVENT, { async: true })
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    try {
      await this.prisma.client.auditLog.create({
        data: {
          id: generateUuidV7(),
          correlationId: RequestContext.getRequestId() ?? null,
          actorUserId: event.userId,
          actorEmail: event.email,
          eventName: event.eventName,
          resourceType: "User",
          resourceId: event.userId,
          payloadJson: {
            fullName: event.fullName,
            roles: [...event.roles],
            occurredAt: event.occurredAt.toISOString(),
          },
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to persist audit log for ${event.eventName}: ${msg}`);
    }
  }
}
