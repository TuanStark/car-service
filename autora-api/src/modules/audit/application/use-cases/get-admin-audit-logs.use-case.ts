import { Injectable } from "@nestjs/common";
import { ApiPropertyOptional } from "@nestjs/swagger";
import type { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { BasePrismaRepository } from "@infra/prisma/base.prisma-repository";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import type { PaginatedResult } from "@core/domain/repository.interface";

export class AdminAuditQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export interface AuditLogItemDto {
  readonly id: string;
  readonly correlationId: string | null;
  readonly actorUserId: string | null;
  readonly actorEmail: string | null;
  readonly eventName: string;
  readonly resourceType: string;
  readonly resourceId: string | null;
  readonly payloadJson: unknown;
  readonly createdAt: string;
}

@Injectable()
export class GetAdminAuditLogsUseCase extends BasePrismaRepository {
  constructor(private readonly uow: PrismaUnitOfWorkService) {
    super();
  }

  async execute(query: AdminAuditQueryDto): Promise<PaginatedResult<AuditLogItemDto>> {
    const client = this.uow.getClient();
    const where: Prisma.AuditLogWhereInput = {};

    if (query.eventName?.trim()) {
      where.eventName = { contains: query.eventName.trim(), mode: "insensitive" };
    }
    if (query.resourceType?.trim()) {
      where.resourceType = query.resourceType.trim();
    }
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { eventName: { contains: s, mode: "insensitive" } },
        { actorEmail: { contains: s, mode: "insensitive" } },
        { resourceId: { contains: s, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const [totalItems, rows] = await Promise.all([
      client.auditLog.count({ where }),
      client.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
    ]);

    const items: AuditLogItemDto[] = rows.map((row) => ({
      id: row.id,
      correlationId: row.correlationId,
      actorUserId: row.actorUserId,
      actorEmail: row.actorEmail,
      eventName: row.eventName,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      payloadJson: row.payloadJson,
      createdAt: row.createdAt.toISOString(),
    }));

    return this.toPaginatedResult(items, { page: query.page, limit: query.limit }, totalItems);
  }
}

