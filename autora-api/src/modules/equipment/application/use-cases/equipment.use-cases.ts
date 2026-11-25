import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import type { PaginatedResult } from "@core/domain/repository.interface";
import {
  EntityConflictException,
  EntityNotFoundException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import {
  assertToolAvailableForCheckout,
  type EquipmentStatusValue,
  isDueWithinDays,
  shouldLockLinkedBay,
} from "../../domain/equipment.rule";
import type {
  CheckoutToolDto,
  CreateEquipmentDto,
  EquipmentQueryDto,
  RecordEquipmentMaintenanceDto,
  ReturnToolDto,
  UpdateEquipmentDto,
} from "../dto/equipment.dto";

export interface EquipmentViewDto {
  readonly id: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly serviceBayId: string | null;
  readonly serviceBayCode: string | null;
  readonly serviceBayName: string | null;
  readonly assetCode: string;
  readonly name: string;
  readonly category: string;
  readonly brandModel: string | null;
  readonly serialNumber: string | null;
  readonly status: EquipmentStatusValue;
  readonly purchaseCostVnd: number;
  readonly nextMaintenanceAt: string | null;
  readonly calibrationDueAt: string | null;
  readonly isDueSoon: boolean;
  readonly notes: string | null;
  readonly activeCheckout: {
    readonly id: string;
    readonly technicianUserId: string;
    readonly technicianName: string;
    readonly technicianEmail: string;
    readonly checkedOutAt: string;
    readonly expectedReturnAt: string | null;
    readonly bookingOrderCode: string | null;
    readonly notes: string | null;
  } | null;
  readonly maintenanceCount: number;
  readonly updatedAt: string;
}

@Injectable()
export class EquipmentUseCases {
  constructor(
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  private assertAdmin(actor: AuthenticatedUser) {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép quản lý thiết bị xưởng và công cụ."
      );
    }
  }

  async listEquipment(
    query: EquipmentQueryDto
  ): Promise<PaginatedResult<EquipmentViewDto>> {
    const db = this.uow.getClient();
    const horizon = new Date(Date.now() + 7 * 86_400_000);

    const where: Prisma.WorkshopEquipmentWhereInput = {
      ...(query.garageId ? { garageId: query.garageId } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.checkedOutOnly
        ? { toolCheckouts: { some: { returnedAt: null } } }
        : {}),
      ...(query.dueSoonOnly
        ? {
            OR: [
              { nextMaintenanceAt: { lte: horizon } },
              { calibrationDueAt: { lte: horizon } },
            ],
          }
        : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { assetCode: { contains: query.search.trim(), mode: "insensitive" } },
              { name: { contains: query.search.trim(), mode: "insensitive" } },
              { brandModel: { contains: query.search.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, totalItems] = await Promise.all([
      db.workshopEquipment.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ status: "asc" }, { assetCode: "asc" }],
        include: {
          garage: { select: { id: true, name: true } },
          serviceBay: { select: { id: true, code: true, name: true } },
          toolCheckouts: {
            where: { returnedAt: null },
            take: 1,
            orderBy: { checkedOutAt: "desc" },
            include: {
              technician: { select: { id: true, fullName: true, email: true } },
              booking: { select: { orderCode: true } },
            },
          },
          _count: { select: { maintenanceLogs: true } },
        },
      }),
      db.workshopEquipment.count({ where }),
    ]);

    const items: EquipmentViewDto[] = rows.map((row) => {
      const checkout = row.toolCheckouts[0] ?? null;
      return {
        id: row.id,
        garageId: row.garageId,
        garageName: row.garage.name,
        serviceBayId: row.serviceBayId,
        serviceBayCode: row.serviceBay?.code ?? null,
        serviceBayName: row.serviceBay?.name ?? null,
        assetCode: row.assetCode,
        name: row.name,
        category: row.category,
        brandModel: row.brandModel,
        serialNumber: row.serialNumber,
        status: row.status as EquipmentStatusValue,
        purchaseCostVnd: row.purchaseCostVnd,
        nextMaintenanceAt: row.nextMaintenanceAt?.toISOString().slice(0, 10) ?? null,
        calibrationDueAt: row.calibrationDueAt?.toISOString().slice(0, 10) ?? null,
        isDueSoon:
          isDueWithinDays(row.nextMaintenanceAt, 7) ||
          isDueWithinDays(row.calibrationDueAt, 7),
        notes: row.notes,
        activeCheckout: checkout
          ? {
              id: checkout.id,
              technicianUserId: checkout.technicianUserId,
              technicianName: checkout.technician.fullName,
              technicianEmail: checkout.technician.email,
              checkedOutAt: checkout.checkedOutAt.toISOString(),
              expectedReturnAt: checkout.expectedReturnAt?.toISOString() ?? null,
              bookingOrderCode: checkout.booking?.orderCode ?? null,
              notes: checkout.notes,
            }
          : null,
        maintenanceCount: row._count.maintenanceLogs,
        updatedAt: row.updatedAt.toISOString(),
      };
    });

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

  async createEquipment(
    dto: CreateEquipmentDto,
    actor: AuthenticatedUser
  ): Promise<EquipmentViewDto> {
    this.assertAdmin(actor);
    const id = generateUuidV7();

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const dup = await client.workshopEquipment.findUnique({
        where: { assetCode: dto.assetCode },
      });
      if (dup) {
        throw new EntityConflictException(
          `Mã tài sản "${dto.assetCode}" đã tồn tại.`
        );
      }

      await client.workshopEquipment.create({
        data: {
          id,
          garageId: dto.garageId,
          serviceBayId: dto.serviceBayId ?? null,
          assetCode: dto.assetCode,
          name: dto.name,
          category: dto.category,
          brandModel: dto.brandModel ?? null,
          serialNumber: dto.serialNumber ?? null,
          purchaseCostVnd: dto.purchaseCostVnd ?? 0,
          nextMaintenanceAt: dto.nextMaintenanceAt
            ? new Date(dto.nextMaintenanceAt)
            : null,
          calibrationDueAt: dto.calibrationDueAt
            ? new Date(dto.calibrationDueAt)
            : null,
          notes: dto.notes ?? null,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.equipment.created",
        resourceType: "WorkshopEquipment",
        resourceId: id,
        payload: { assetCode: dto.assetCode, name: dto.name, category: dto.category },
      });
    });

    const res = await this.listEquipment({
      page: 1,
      limit: 1,
      search: dto.assetCode,
    });
    return res.items[0]!;
  }

  async updateEquipment(
    id: string,
    dto: UpdateEquipmentDto,
    actor: AuthenticatedUser
  ): Promise<{
    equipment: EquipmentViewDto;
    lockedBayCode: string | null;
    affectedBookingsCount: number;
  }> {
    this.assertAdmin(actor);

    let lockedBayCode: string | null = null;
    let affectedBookingsCount = 0;

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.workshopEquipment.findUnique({
        where: { id },
        include: { serviceBay: { select: { id: true, code: true } } },
      });
      if (!existing) {
        throw new EntityNotFoundException("Thiết bị xưởng", id);
      }

      const nextStatus = (dto.status ?? existing.status) as EquipmentStatusValue;
      const targetBayId =
        dto.serviceBayId !== undefined ? dto.serviceBayId : existing.serviceBayId;

      await client.workshopEquipment.update({
        where: { id },
        data: {
          ...(dto.serviceBayId !== undefined ? { serviceBayId: dto.serviceBayId } : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.nextMaintenanceAt !== undefined
            ? { nextMaintenanceAt: new Date(dto.nextMaintenanceAt) }
            : {}),
          ...(dto.calibrationDueAt !== undefined
            ? { calibrationDueAt: new Date(dto.calibrationDueAt) }
            : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        },
      });

      if (targetBayId && shouldLockLinkedBay(nextStatus)) {
        const bay = await client.serviceBay.update({
          where: { id: targetBayId },
          data: { status: "MAINTENANCE" },
        });
        lockedBayCode = bay.code;

        affectedBookingsCount = await client.booking.count({
          where: {
            bayId: targetBayId,
            status: {
              in: [
                "PENDING_CONFIRMATION",
                "CONFIRMED",
                "CHECKED_IN",
                "IN_PROGRESS",
              ],
            },
          },
        });
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.equipment.updated",
        resourceType: "WorkshopEquipment",
        resourceId: id,
        payload: {
          assetCode: existing.assetCode,
          status: nextStatus,
          lockedBayCode,
          affectedBookingsCount,
        },
      });
    });

    const list = await this.listEquipment({ page: 1, limit: 50 });
    const equipment = list.items.find((e) => e.id === id)!;
    return { equipment, lockedBayCode, affectedBookingsCount };
  }

  async recordMaintenance(
    id: string,
    dto: RecordEquipmentMaintenanceDto,
    actor: AuthenticatedUser
  ): Promise<EquipmentViewDto> {
    this.assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.workshopEquipment.findUnique({ where: { id } });
      if (!existing) {
        throw new EntityNotFoundException("Thiết bị xưởng", id);
      }

      await client.equipmentMaintenanceLog.create({
        data: {
          id: generateUuidV7(),
          equipmentId: id,
          maintenanceType: dto.maintenanceType,
          costVnd: dto.costVnd,
          vendorName: dto.vendorName ?? null,
          nextDueAt: dto.nextDueAt ? new Date(dto.nextDueAt) : null,
          notes: dto.notes ?? null,
          recordedByEmail: actor.email,
        },
      });

      const updateData: Prisma.WorkshopEquipmentUpdateInput = {};
      if (dto.nextDueAt) {
        if (dto.maintenanceType === "CALIBRATION") {
          updateData.calibrationDueAt = new Date(dto.nextDueAt);
        } else {
          updateData.nextMaintenanceAt = new Date(dto.nextDueAt);
        }
      }
      if (dto.restoreOperational ?? true) {
        updateData.status = "OPERATIONAL";
      }

      await client.workshopEquipment.update({
        where: { id },
        data: updateData,
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.equipment.maintenance_recorded",
        resourceType: "WorkshopEquipment",
        resourceId: id,
        payload: {
          assetCode: existing.assetCode,
          maintenanceType: dto.maintenanceType,
          costVnd: dto.costVnd,
        },
      });
    });

    const list = await this.listEquipment({ page: 1, limit: 50 });
    return list.items.find((e) => e.id === id)!;
  }

  async checkoutTool(
    id: string,
    dto: CheckoutToolDto,
    actor: AuthenticatedUser
  ): Promise<EquipmentViewDto> {
    this.assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const eq = await client.workshopEquipment.findUnique({
        where: { id },
        include: {
          toolCheckouts: { where: { returnedAt: null }, take: 1 },
        },
      });
      if (!eq) {
        throw new EntityNotFoundException("Thiết bị / Công cụ", id);
      }

      assertToolAvailableForCheckout({
        hasActiveCheckout: eq.toolCheckouts.length > 0,
        equipmentStatus: eq.status as EquipmentStatusValue,
        equipmentName: `${eq.assetCode} (${eq.name})`,
      });

      const tech = await client.user.findUnique({
        where: { id: dto.technicianUserId },
        select: { id: true, fullName: true },
      });
      if (!tech) {
        throw new EntityNotFoundException("Kỹ thuật viên", dto.technicianUserId);
      }

      await client.toolCheckoutLog.create({
        data: {
          id: generateUuidV7(),
          equipmentId: id,
          technicianUserId: dto.technicianUserId,
          bookingId: dto.bookingId ?? null,
          expectedReturnAt: dto.expectedReturnAt
            ? new Date(dto.expectedReturnAt)
            : null,
          notes: dto.notes ?? null,
        },
      });

      await client.workshopEquipment.update({
        where: { id },
        data: { status: "IN_USE" },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.equipment.tool_checked_out",
        resourceType: "WorkshopEquipment",
        resourceId: id,
        payload: {
          assetCode: eq.assetCode,
          technicianName: tech.fullName,
        },
      });
    });

    const list = await this.listEquipment({ page: 1, limit: 50 });
    return list.items.find((e) => e.id === id)!;
  }

  async returnTool(
    id: string,
    dto: ReturnToolDto,
    actor: AuthenticatedUser
  ): Promise<EquipmentViewDto> {
    this.assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const eq = await client.workshopEquipment.findUnique({ where: { id } });
      if (!eq) {
        throw new EntityNotFoundException("Thiết bị / Công cụ", id);
      }

      const active = await client.toolCheckoutLog.findFirst({
        where: { equipmentId: id, returnedAt: null },
        orderBy: { checkedOutAt: "desc" },
      });
      if (!active) {
        throw new EntityNotFoundException("Phiếu mượn dụng cụ đang mở", id);
      }

      await client.toolCheckoutLog.update({
        where: { id: active.id },
        data: {
          returnedAt: new Date(),
          returnCondition: dto.returnCondition,
          notes: dto.notes ?? active.notes,
        },
      });

      await client.workshopEquipment.update({
        where: { id },
        data: {
          status:
            dto.returnCondition === "GOOD" ? "OPERATIONAL" : "BROKEN",
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.equipment.tool_returned",
        resourceType: "WorkshopEquipment",
        resourceId: id,
        payload: {
          assetCode: eq.assetCode,
          returnCondition: dto.returnCondition,
        },
      });
    });

    const list = await this.listEquipment({ page: 1, limit: 50 });
    return list.items.find((e) => e.id === id)!;
  }
}
