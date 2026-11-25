import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { RequestContext } from "@core/middlewares/correlation-id.middleware";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";

export interface RecordAdminAuditInput {
  readonly actorUserId: string;
  readonly actorEmail: string;
  readonly eventName: string;
  readonly resourceType: string;
  readonly resourceId?: string;
  readonly payload?: Record<string, unknown>;
}

/**
 * Persists privileged administrative actions to AuditLog inside the active
 * Prisma Unit-of-Work transaction when present.
 */
@Injectable()
export class AdminAuditWriterService {
  constructor(private readonly uow: PrismaUnitOfWorkService) {}

  async record(input: RecordAdminAuditInput): Promise<void> {
    const client = this.uow.getClient();
    await client.auditLog.create({
      data: {
        id: generateUuidV7(),
        correlationId: RequestContext.getRequestId() ?? null,
        actorUserId: input.actorUserId,
        actorEmail: input.actorEmail,
        eventName: input.eventName,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        payloadJson: (input.payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  }
}

