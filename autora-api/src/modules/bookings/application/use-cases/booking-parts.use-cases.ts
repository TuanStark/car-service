import { Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import {
  BusinessRuleViolationException,
  EntityNotFoundException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import { assertSufficientStock } from "@modules/inventory/domain/inventory.rule";
import {
  BOOKING_REPOSITORY,
  type BookingDetailDto,
  type IBookingRepository,
} from "../../domain/repositories/booking.repository.interface";
import type { IssueManualPartDto } from "../dto/admin-booking.dto";

@Injectable()
export class BookingPartsUseCases {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepo: IBookingRepository,
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  private assertAdmin(actor: AuthenticatedUser) {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép xuất/hoàn vật tư cho Lệnh sửa chữa."
      );
    }
  }

  async issueBomParts(
    bookingId: string,
    actor: AuthenticatedUser
  ): Promise<BookingDetailDto> {
    this.assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const booking = await client.booking.findUnique({
        where: { id: bookingId },
        include: { items: true },
      });
      if (!booking) {
        throw new EntityNotFoundException("Lịch hẹn", bookingId);
      }

      let vehicleBodyType = "ALL";
      if (booking.vehicleId) {
        const vehicle = await client.customerVehicle.findUnique({
          where: { id: booking.vehicleId },
          select: { bodyType: true },
        });
        if (vehicle?.bodyType) {
          vehicleBodyType = vehicle.bodyType;
        }
      }

      const serviceIds = [
        ...new Set(
          booking.items
            .map((i) => i.serviceProductId)
            .filter((id): id is string => Boolean(id))
        ),
      ];
      if (serviceIds.length === 0) {
        throw new BusinessRuleViolationException(
          "Lệnh sửa chữa chưa có dịch vụ chuẩn nào để xuất theo BOM."
        );
      }

      const recipes = await client.servicePartRecipe.findMany({
        where: { serviceProductId: { in: serviceIds } },
      });

      const aggregatedQtyByPart = new Map<string, number>();
      for (const item of booking.items) {
        if (!item.serviceProductId) continue;
        const itemRecipes = recipes.filter(
          (r) => r.serviceProductId === item.serviceProductId
        );
        const byPart = new Map<
          string,
          { exact?: (typeof itemRecipes)[number]; fallback?: (typeof itemRecipes)[number] }
        >();
        for (const r of itemRecipes) {
          const entry = byPart.get(r.partItemId) ?? {};
          if (r.vehicleBodyType === vehicleBodyType) {
            entry.exact = r;
          } else if (r.vehicleBodyType === "ALL") {
            entry.fallback = r;
          }
          byPart.set(r.partItemId, entry);
        }

        for (const [partItemId, entry] of byPart.entries()) {
          const chosen = entry.exact ?? entry.fallback;
          if (!chosen || chosen.isOptional) continue;
          const qty = Number(chosen.standardQty) * item.quantity;
          aggregatedQtyByPart.set(
            partItemId,
            (aggregatedQtyByPart.get(partItemId) ?? 0) + qty
          );
        }
      }

      if (aggregatedQtyByPart.size === 0) {
        throw new BusinessRuleViolationException(
          "Các dịch vụ trong RO này chưa được cấu hình Định mức vật tư (BOM)."
        );
      }

      const partIds = [...aggregatedQtyByPart.keys()];
      const parts = await client.partItem.findMany({
        where: { id: { in: partIds } },
      });
      const partMap = new Map(parts.map((p) => [p.id, p]));

      for (const [partItemId, qty] of aggregatedQtyByPart.entries()) {
        const part = partMap.get(partItemId);
        if (!part) continue;

        const inv = await client.garageInventory.findUnique({
          where: {
            garageId_partItemId: {
              garageId: booking.garageId,
              partItemId,
            },
          },
        });
        const onHand = inv ? Number(inv.onHandQty) : 0;
        assertSufficientStock({
          availableQty: onHand,
          requestedQty: qty,
          partName: `${part.sku} (${part.name})`,
        });

        await client.garageInventory.update({
          where: {
            garageId_partItemId: {
              garageId: booking.garageId,
              partItemId,
            },
          },
          data: { onHandQty: onHand - qty },
        });

        await client.stockMovement.create({
          data: {
            id: generateUuidV7(),
            garageId: booking.garageId,
            partItemId,
            type: "OUT_WORK_ORDER",
            qtyDelta: -qty,
            unitCostVnd: part.avgCostVnd,
            referenceType: "BOOKING",
            referenceId: booking.id,
            reason: `Xuất theo BOM cho RO ${booking.orderCode}`,
            createdByEmail: actor.email,
          },
        });

        await client.bookingPartUsage.create({
          data: {
            id: generateUuidV7(),
            bookingId: booking.id,
            garageId: booking.garageId,
            partItemId,
            qtyUsed: qty,
            unitCostVnd: part.avgCostVnd,
            unitSellVnd: 0,
            lineCostVnd: Math.round(qty * part.avgCostVnd),
            issuedByEmail: actor.email,
          },
        });
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.booking.parts_issued_bom",
        resourceType: "Booking",
        resourceId: booking.id,
        payload: {
          orderCode: booking.orderCode,
          partCount: aggregatedQtyByPart.size,
        },
      });
    });

    const detail = await this.bookingRepo.findDetailById(bookingId);
    if (!detail) {
      throw new EntityNotFoundException("Lịch hẹn", bookingId);
    }
    return detail;
  }

  async issueManualPart(
    bookingId: string,
    dto: IssueManualPartDto,
    actor: AuthenticatedUser
  ): Promise<BookingDetailDto> {
    this.assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const booking = await client.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, orderCode: true, garageId: true },
      });
      if (!booking) {
        throw new EntityNotFoundException("Lịch hẹn", bookingId);
      }

      const part = await client.partItem.findUnique({
        where: { id: dto.partItemId },
      });
      if (!part) {
        throw new EntityNotFoundException("Phụ tùng / Vật tư", dto.partItemId);
      }

      const inv = await client.garageInventory.findUnique({
        where: {
          garageId_partItemId: {
            garageId: booking.garageId,
            partItemId: part.id,
          },
        },
      });
      const onHand = inv ? Number(inv.onHandQty) : 0;
      assertSufficientStock({
        availableQty: onHand,
        requestedQty: dto.qtyUsed,
        partName: `${part.sku} (${part.name})`,
      });

      await client.garageInventory.update({
        where: {
          garageId_partItemId: {
            garageId: booking.garageId,
            partItemId: part.id,
          },
        },
        data: { onHandQty: onHand - dto.qtyUsed },
      });

      await client.stockMovement.create({
        data: {
          id: generateUuidV7(),
          garageId: booking.garageId,
          partItemId: part.id,
          type: "OUT_WORK_ORDER",
          qtyDelta: -dto.qtyUsed,
          unitCostVnd: part.avgCostVnd,
          referenceType: "BOOKING",
          referenceId: booking.id,
          reason: dto.note ?? `Xuất lẻ cho RO ${booking.orderCode}`,
          createdByEmail: actor.email,
        },
      });

      await client.bookingPartUsage.create({
        data: {
          id: generateUuidV7(),
          bookingId: booking.id,
          garageId: booking.garageId,
          partItemId: part.id,
          qtyUsed: dto.qtyUsed,
          unitCostVnd: part.avgCostVnd,
          unitSellVnd: 0,
          lineCostVnd: Math.round(dto.qtyUsed * part.avgCostVnd),
          issuedByEmail: actor.email,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.booking.part_issued",
        resourceType: "Booking",
        resourceId: booking.id,
        payload: {
          orderCode: booking.orderCode,
          sku: part.sku,
          qtyUsed: dto.qtyUsed,
        },
      });
    });

    const detail = await this.bookingRepo.findDetailById(bookingId);
    if (!detail) {
      throw new EntityNotFoundException("Lịch hẹn", bookingId);
    }
    return detail;
  }

  async returnPart(
    bookingId: string,
    usageId: string,
    actor: AuthenticatedUser
  ): Promise<BookingDetailDto> {
    this.assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const booking = await client.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, orderCode: true, garageId: true },
      });
      if (!booking) {
        throw new EntityNotFoundException("Lịch hẹn", bookingId);
      }

      const usage = await client.bookingPartUsage.findFirst({
        where: { id: usageId, bookingId },
        include: { partItem: true },
      });
      if (!usage) {
        throw new EntityNotFoundException("Phiếu xuất vật tư", usageId);
      }

      const qtyReturned = Number(usage.qtyUsed);
      const inv = await client.garageInventory.findUnique({
        where: {
          garageId_partItemId: {
            garageId: booking.garageId,
            partItemId: usage.partItemId,
          },
        },
      });
      const currentOnHand = inv ? Number(inv.onHandQty) : 0;

      if (inv) {
        await client.garageInventory.update({
          where: {
            garageId_partItemId: {
              garageId: booking.garageId,
              partItemId: usage.partItemId,
            },
          },
          data: { onHandQty: currentOnHand + qtyReturned },
        });
      } else {
        await client.garageInventory.create({
          data: {
            id: generateUuidV7(),
            garageId: booking.garageId,
            partItemId: usage.partItemId,
            onHandQty: qtyReturned,
          },
        });
      }

      await client.bookingPartUsage.delete({ where: { id: usage.id } });

      await client.stockMovement.create({
        data: {
          id: generateUuidV7(),
          garageId: booking.garageId,
          partItemId: usage.partItemId,
          type: "RETURN_WORK_ORDER",
          qtyDelta: qtyReturned,
          unitCostVnd: usage.unitCostVnd,
          referenceType: "BOOKING",
          referenceId: booking.id,
          reason: `Hoàn kho từ RO ${booking.orderCode}`,
          createdByEmail: actor.email,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.booking.part_returned",
        resourceType: "Booking",
        resourceId: booking.id,
        payload: {
          orderCode: booking.orderCode,
          sku: usage.partItem.sku,
          qtyReturned,
        },
      });
    });

    const detail = await this.bookingRepo.findDetailById(bookingId);
    if (!detail) {
      throw new EntityNotFoundException("Lịch hẹn", bookingId);
    }
    return detail;
  }
}
