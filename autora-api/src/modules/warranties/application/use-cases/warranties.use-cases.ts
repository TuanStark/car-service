import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import type { PaginatedResult } from "@core/domain/repository.interface";
import {
  EntityNotFoundException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import type {
  CreateWarrantyClaimDto,
  UpdateWarrantyClaimDto,
  WarrantyQueryDto,
} from "../dto/warranty.dto";

export interface WarrantyClaimDto {
  readonly id: string;
  readonly issueDescription: string;
  readonly rootCause: string;
  readonly internalCostVnd: number;
  readonly resolution: string | null;
  readonly status: string;
  readonly handledByEmail: string | null;
  readonly createdAt: string;
}

export interface WarrantyRecordDto {
  readonly id: string;
  readonly warrantyCode: string;
  readonly bookingId: string;
  readonly bookingOrderCode: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly serviceNameSnap: string;
  readonly licensePlate: string;
  readonly customerName: string;
  readonly warrantyLabel: string;
  readonly startsAt: string;
  readonly validUntilDate: string;
  readonly startOdoKm: number;
  readonly validUntilOdoKm: number | null;
  readonly status: string;
  readonly claims: readonly WarrantyClaimDto[];
}

export function parseWarrantyMonths(label: string): number {
  const monthMatch = label.match(/(\d+)\s*tháng/i);
  if (monthMatch) return Math.max(1, Number(monthMatch[1]));
  const yearMatch = label.match(/(\d+)\s*năm/i);
  if (yearMatch) return Math.max(1, Number(yearMatch[1]) * 12);
  return 6;
}

@Injectable()
export class WarrantiesUseCases {
  constructor(
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  private assertAdmin(actor: AuthenticatedUser) {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép quản lý bảo hành điện tử."
      );
    }
  }

  async issueForBooking(bookingId: string): Promise<number> {
    const client = this.uow.getClient();
    const booking = await client.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: {
          include: { serviceProduct: { select: { warrantyLabel: true } } },
        },
        warrantyRecords: { select: { serviceProductId: true, serviceNameSnap: true } },
      },
    });
    if (!booking) return 0;

    let created = 0;
    for (const item of booking.items) {
      const alreadyExists = booking.warrantyRecords.some(
        (w) =>
          (item.serviceProductId && w.serviceProductId === item.serviceProductId) ||
          w.serviceNameSnap === item.serviceNameSnap
      );
      if (alreadyExists) continue;

      const label = item.serviceProduct?.warrantyLabel ?? "6 tháng / 5.000 km";
      const months = parseWarrantyMonths(label);
      const startsAt = new Date();
      const validUntil = new Date(startsAt);
      validUntil.setMonth(validUntil.getMonth() + months);

      await client.warrantyRecord.create({
        data: {
          id: generateUuidV7(),
          warrantyCode: `BH-${booking.orderCode.slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
          bookingId: booking.id,
          vehicleId: booking.vehicleId,
          garageId: booking.garageId,
          serviceProductId: item.serviceProductId,
          serviceNameSnap: item.serviceNameSnap,
          licensePlate: booking.licensePlate,
          customerName: booking.customerName,
          warrantyLabel: label,
          startsAt,
          validUntilDate: validUntil,
          startOdoKm: booking.odoKm,
          validUntilOdoKm: booking.odoKm + 10_000,
          status: "ACTIVE",
        },
      });
      created += 1;
    }

    return created;
  }

  async listWarranties(
    query: WarrantyQueryDto
  ): Promise<PaginatedResult<WarrantyRecordDto>> {
    const db = this.uow.getClient();
    const where: Prisma.WarrantyRecordWhereInput = {
      ...(query.garageId ? { garageId: query.garageId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { warrantyCode: { contains: query.search.trim(), mode: "insensitive" } },
              { licensePlate: { contains: query.search.trim(), mode: "insensitive" } },
              { customerName: { contains: query.search.trim(), mode: "insensitive" } },
              { serviceNameSnap: { contains: query.search.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, totalItems] = await Promise.all([
      db.warrantyRecord.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: "desc" }],
        include: {
          booking: { select: { orderCode: true } },
          garage: { select: { name: true } },
          claims: { orderBy: { createdAt: "desc" } },
        },
      }),
      db.warrantyRecord.count({ where }),
    ]);

    const items: WarrantyRecordDto[] = rows.map((r) => ({
      id: r.id,
      warrantyCode: r.warrantyCode,
      bookingId: r.bookingId,
      bookingOrderCode: r.booking.orderCode,
      garageId: r.garageId,
      garageName: r.garage.name,
      serviceNameSnap: r.serviceNameSnap,
      licensePlate: r.licensePlate,
      customerName: r.customerName,
      warrantyLabel: r.warrantyLabel,
      startsAt: r.startsAt.toISOString(),
      validUntilDate: r.validUntilDate.toISOString().slice(0, 10),
      startOdoKm: r.startOdoKm,
      validUntilOdoKm: r.validUntilOdoKm,
      status: r.status,
      claims: r.claims.map((c) => ({
        id: c.id,
        issueDescription: c.issueDescription,
        rootCause: c.rootCause,
        internalCostVnd: c.internalCostVnd,
        resolution: c.resolution,
        status: c.status,
        handledByEmail: c.handledByEmail,
        createdAt: c.createdAt.toISOString(),
      })),
    }));

    const totalPages = Math.max(1, Math.ceil(totalItems / query.limit));
    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPrevPage: query.page > 1,
      },
    };
  }

  async createClaim(
    warrantyId: string,
    dto: CreateWarrantyClaimDto,
    actor: AuthenticatedUser
  ): Promise<WarrantyRecordDto> {
    this.assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const record = await client.warrantyRecord.findUnique({
        where: { id: warrantyId },
      });
      if (!record) {
        throw new EntityNotFoundException("Sổ bảo hành điện tử", warrantyId);
      }

      const claimId = generateUuidV7();
      await client.warrantyClaim.create({
        data: {
          id: claimId,
          warrantyRecordId: warrantyId,
          issueDescription: dto.issueDescription,
          rootCause: dto.rootCause,
          internalCostVnd: dto.internalCostVnd ?? 0,
          resolution: dto.resolution ?? null,
          status: "OPEN",
          handledByEmail: actor.email,
        },
      });

      await client.warrantyRecord.update({
        where: { id: warrantyId },
        data: { status: "CLAIMED" },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.warranty.claim_created",
        resourceType: "WarrantyRecord",
        resourceId: warrantyId,
        payload: {
          warrantyCode: record.warrantyCode,
          rootCause: dto.rootCause,
          internalCostVnd: dto.internalCostVnd ?? 0,
        },
      });
    });

    const list = await this.listWarranties({ page: 1, limit: 50 });
    return list.items.find((w) => w.id === warrantyId)!;
  }

  async updateClaim(
    claimId: string,
    dto: UpdateWarrantyClaimDto,
    actor: AuthenticatedUser
  ): Promise<WarrantyClaimDto> {
    this.assertAdmin(actor);

    return this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const claim = await client.warrantyClaim.findUnique({ where: { id: claimId } });
      if (!claim) {
        throw new EntityNotFoundException("Phiếu yêu cầu bảo hành", claimId);
      }

      const updated = await client.warrantyClaim.update({
        where: { id: claimId },
        data: {
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.rootCause !== undefined ? { rootCause: dto.rootCause } : {}),
          ...(dto.internalCostVnd !== undefined
            ? { internalCostVnd: dto.internalCostVnd }
            : {}),
          ...(dto.resolution !== undefined ? { resolution: dto.resolution } : {}),
          handledByEmail: actor.email,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.warranty.claim_updated",
        resourceType: "WarrantyClaim",
        resourceId: claimId,
        payload: { status: updated.status, internalCostVnd: updated.internalCostVnd },
      });

      return {
        id: updated.id,
        issueDescription: updated.issueDescription,
        rootCause: updated.rootCause,
        internalCostVnd: updated.internalCostVnd,
        resolution: updated.resolution,
        status: updated.status,
        handledByEmail: updated.handledByEmail,
        createdAt: updated.createdAt.toISOString(),
      };
    });
  }
}

