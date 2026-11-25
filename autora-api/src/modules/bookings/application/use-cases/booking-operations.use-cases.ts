import { Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import {
  BusinessRuleViolationException,
  EntityConflictException,
  EntityNotFoundException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import {
  assertSlotCapacityAvailable,
  STANDARD_TIME_SLOTS,
} from "../../domain/booking-capacity.rule";
import { assertValidPaymentAction, type PaymentStatusValue } from "../../domain/booking-payment-machine";
import {
  type BookingStatusValue,
  TERMINAL_BOOKING_STATUSES,
} from "../../domain/booking-status-machine";
import {
  BOOKING_REPOSITORY,
  type BookingDetailDto,
  type IBookingRepository,
} from "../../domain/repositories/booking.repository.interface";
import type {
  AddBookingItemDto,
  CreateAdminBookingDto,
  DispatchScheduleQueryDto,
  RecordBookingInspectionDto,
  RecordBookingPaymentDto,
  RescheduleBookingDto,
} from "../dto/admin-booking.dto";

export interface DispatchSlotBookingDto {
  readonly id: string;
  readonly orderCode: string;
  readonly customerName: string;
  readonly vehicleLabel: string;
  readonly licensePlate: string;
  readonly status: BookingStatusValue;
  readonly totalVnd: number;
  readonly bayId: string | null;
  readonly appointmentTime: string;
}

export interface DispatchGarageScheduleDto {
  readonly garageId: string;
  readonly garageName: string;
  readonly bayCount: number;
  readonly bays: readonly {
    readonly id: string;
    readonly code: string;
    readonly name: string;
    readonly bayType: string;
    readonly status: string;
  }[];
  readonly slots: readonly {
    readonly time: string;
    readonly activeCount: number;
    readonly bayCount: number;
    readonly bookings: readonly DispatchSlotBookingDto[];
  }[];
}

function assertAdminRole(actor: AuthenticatedUser): void {
  if (!actor.roles.includes("admin")) {
    throw new ForbiddenDomainException(
      "Chỉ quản trị viên mới được phép thực hiện thao tác điều phối này."
    );
  }
}

@Injectable()
export class GetBookingDispatchScheduleUseCase {
  constructor(private readonly uow: PrismaUnitOfWorkService) {}

  async execute(
    query: DispatchScheduleQueryDto
  ): Promise<DispatchGarageScheduleDto[]> {
    const client = this.uow.getClient();
    const targetDate = new Date(`${query.date}T00:00:00.000Z`);

    const garages = await client.garage.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        ...(query.garageId ? { id: query.garageId } : {}),
      },
      orderBy: { name: "asc" },
      include: {
        bays: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (garages.length === 0) return [];

    const bookings = await client.booking.findMany({
      where: {
        deletedAt: null,
        garageId: { in: garages.map((g) => g.id) },
        appointmentDate: targetDate,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      orderBy: { appointmentTime: "asc" },
    });

    return garages.map((garage) => {
      const garageBookings = bookings.filter((b) => b.garageId === garage.id);
      const effectiveBayCount =
        garage.bays.length > 0 ? garage.bays.length : garage.bayCount;

      return {
        garageId: garage.id,
        garageName: garage.name,
        bayCount: effectiveBayCount,
        bays: garage.bays.map((bay) => ({
          id: bay.id,
          code: bay.code,
          name: bay.name,
          bayType: bay.bayType,
          status: bay.status,
        })),
        slots: STANDARD_TIME_SLOTS.map((time) => {
          const slotBookings = garageBookings
            .filter((b) => b.appointmentTime === time)
            .map((b) => ({
              id: b.id,
              orderCode: b.orderCode,
              customerName: b.customerName,
              vehicleLabel: b.vehicleLabel,
              licensePlate: b.licensePlate,
              status: b.status as BookingStatusValue,
              totalVnd: b.totalVnd,
              bayId: b.bayId,
              appointmentTime: b.appointmentTime,
            }));

          return {
            time,
            activeCount: slotBookings.length,
            bayCount: effectiveBayCount,
            bookings: slotBookings,
          };
        }),
      };
    });
  }
}

@Injectable()
export class CreateAdminBookingUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepo: IBookingRepository,
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  async execute(
    dto: CreateAdminBookingDto,
    actor: AuthenticatedUser
  ): Promise<BookingDetailDto> {
    assertAdminRole(actor);

    const createdId = await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();

      const garage = await client.garage.findFirst({
        where: { id: dto.garageId, deletedAt: null },
        include: { bays: true, garageServices: true },
      });
      if (!garage) {
        throw new EntityNotFoundException("Garage", dto.garageId);
      }

      const appointmentDate = new Date(`${dto.appointmentDate}T00:00:00.000Z`);
      const activeInSlot = await client.booking.findMany({
        where: {
          deletedAt: null,
          garageId: dto.garageId,
          appointmentDate,
          appointmentTime: dto.appointmentTime,
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
        select: { id: true, bayId: true },
      });

      let selectedBayStatus: string | null = null;
      let bayOccupied = false;
      if (dto.bayId) {
        const bay = garage.bays.find((b) => b.id === dto.bayId);
        if (!bay) {
          throw new EntityNotFoundException("Cầu nâng", dto.bayId);
        }
        selectedBayStatus = bay.status;
        bayOccupied = activeInSlot.some((b) => b.bayId === dto.bayId);
      }

      const effectiveBayCount =
        garage.bays.filter((b) => b.status !== "MAINTENANCE").length ||
        garage.bayCount;

      assertSlotCapacityAvailable({
        activeBookingsInSlot: activeInSlot.length,
        bayCount: effectiveBayCount,
        bayStatus: selectedBayStatus,
        bayOccupiedInSlot: bayOccupied,
        allowOverbook: dto.allowOverbook,
      });

      const productIds = dto.items.map((i) => i.serviceProductId);
      const products = await client.serviceProduct.findMany({
        where: { id: { in: productIds }, deletedAt: null },
      });

      const customPriceMap = new Map(
        garage.garageServices.map((gs) => [gs.serviceProductId, gs.customPriceVnd])
      );

      let subtotalVnd = 0;
      const itemCreates = dto.items.map((reqItem) => {
        const product = products.find((p) => p.id === reqItem.serviceProductId);
        if (!product) {
          throw new EntityNotFoundException("Gói dịch vụ", reqItem.serviceProductId);
        }
        const unitPriceVnd = customPriceMap.get(product.id) ?? product.priceVnd;
        const quantity = reqItem.quantity ?? 1;
        const lineTotalVnd = unitPriceVnd * quantity;
        subtotalVnd += lineTotalVnd;

        return {
          id: generateUuidV7(),
          serviceProductId: product.id,
          serviceNameSnap: product.name,
          skuSnap: product.sku,
          unitPriceVnd,
          quantity,
          lineTotalVnd,
        };
      });

      const bookingId = generateUuidV7();
      const orderCode = `ATR-HL-${String(Date.now()).slice(-6)}`;
      const initialStatus = dto.initialStatus ?? "CONFIRMED";

      await client.booking.create({
        data: {
          id: bookingId,
          orderCode,
          garageId: dto.garageId,
          bayId: dto.bayId ?? null,
          appointmentDate,
          appointmentTime: dto.appointmentTime,
          customerName: dto.customerName.trim(),
          customerPhone: dto.customerPhone.trim(),
          vehicleLabel: dto.vehicleLabel.trim(),
          licensePlate: dto.licensePlate.trim().toUpperCase(),
          odoKm: dto.odoKm,
          paymentMethod: dto.paymentMethod ?? "PAY_AT_GARAGE",
          paymentStatus: "UNPAID",
          status: initialStatus,
          checkedInAt: initialStatus === "CHECKED_IN" ? new Date() : null,
          subtotalVnd,
          discountVnd: 0,
          totalVnd: subtotalVnd,
          notes: dto.notes?.trim() || null,
          items: { create: itemCreates },
          statusHistory: {
            create: [
              {
                id: generateUuidV7(),
                fromStatus: null,
                toStatus: initialStatus,
                reason: "Đặt lịch hộ qua Hotline / Tại xưởng",
                changedByUserId: actor.id,
                changedByEmail: actor.email,
              },
            ],
          },
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.booking.created_hotline",
        resourceType: "Booking",
        resourceId: bookingId,
        payload: {
          orderCode,
          garageId: dto.garageId,
          totalVnd: subtotalVnd,
        },
      });

      return bookingId;
    });

    const detail = await this.bookingRepo.findDetailById(createdId);
    if (!detail) {
      throw new EntityNotFoundException("Lịch hẹn", createdId);
    }
    return detail;
  }
}

@Injectable()
export class RescheduleBookingUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepo: IBookingRepository,
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  async execute(
    id: string,
    dto: RescheduleBookingDto,
    actor: AuthenticatedUser
  ): Promise<BookingDetailDto> {
    assertAdminRole(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.booking.findFirst({
        where: { id, deletedAt: null },
      });
      if (!existing) {
        throw new EntityNotFoundException("Lịch hẹn", id);
      }

      if (TERMINAL_BOOKING_STATUSES.includes(existing.status as BookingStatusValue)) {
        throw new BusinessRuleViolationException(
          "Không thể dời lịch đối với đơn đã kết thúc.",
          "BOOKING_TERMINAL_CANNOT_RESCHEDULE"
        );
      }

      if (existing.version !== dto.expectedVersion) {
        throw new EntityConflictException(
          "Dữ liệu lịch hẹn vừa được cập nhật bởi người khác. Vui lòng tải lại trang."
        );
      }

      const targetGarageId = dto.garageId ?? existing.garageId;
      const garage = await client.garage.findFirst({
        where: { id: targetGarageId, deletedAt: null },
        include: { bays: true },
      });
      if (!garage) {
        throw new EntityNotFoundException("Garage", targetGarageId);
      }

      const targetDate = new Date(`${dto.appointmentDate}T00:00:00.000Z`);
      const activeInSlot = await client.booking.findMany({
        where: {
          deletedAt: null,
          id: { not: id },
          garageId: targetGarageId,
          appointmentDate: targetDate,
          appointmentTime: dto.appointmentTime,
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
        select: { id: true, bayId: true },
      });

      const targetBayId =
        dto.bayId !== undefined
          ? dto.bayId
          : targetGarageId === existing.garageId
            ? existing.bayId
            : null;

      let bayStatus: string | null = null;
      let bayOccupied = false;
      if (targetBayId) {
        const bay = garage.bays.find((b) => b.id === targetBayId);
        if (!bay) {
          throw new EntityNotFoundException("Cầu nâng", targetBayId);
        }
        bayStatus = bay.status;
        bayOccupied = activeInSlot.some((b) => b.bayId === targetBayId);
      }

      const effectiveBayCount =
        garage.bays.filter((b) => b.status !== "MAINTENANCE").length ||
        garage.bayCount;

      assertSlotCapacityAvailable({
        activeBookingsInSlot: activeInSlot.length,
        bayCount: effectiveBayCount,
        bayStatus,
        bayOccupiedInSlot: bayOccupied,
        allowOverbook: dto.allowOverbook,
      });

      const updated = await client.booking.updateMany({
        where: { id, version: dto.expectedVersion, deletedAt: null },
        data: {
          garageId: targetGarageId,
          bayId: targetBayId,
          appointmentDate: targetDate,
          appointmentTime: dto.appointmentTime,
          ...(dto.odoKm !== undefined ? { odoKm: dto.odoKm } : {}),
          rescheduleCount: { increment: 1 },
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new EntityConflictException(
          "Xung đột phiên bản khi dời lịch hẹn. Vui lòng thử lại."
        );
      }

      await client.bookingStatusHistory.create({
        data: {
          id: generateUuidV7(),
          bookingId: id,
          fromStatus: existing.status,
          toStatus: existing.status,
          reason:
            dto.reason?.trim() ||
            `Điều phối lại sang ${dto.appointmentDate} lúc ${dto.appointmentTime}`,
          changedByUserId: actor.id,
          changedByEmail: actor.email,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.booking.rescheduled",
        resourceType: "Booking",
        resourceId: id,
        payload: {
          appointmentDate: dto.appointmentDate,
          appointmentTime: dto.appointmentTime,
          garageId: targetGarageId,
          bayId: targetBayId,
        },
      });
    });

    const detail = await this.bookingRepo.findDetailById(id);
    if (!detail) throw new EntityNotFoundException("Lịch hẹn", id);
    return detail;
  }
}

@Injectable()
export class RecordBookingPaymentUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepo: IBookingRepository,
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  async execute(
    id: string,
    dto: RecordBookingPaymentDto,
    actor: AuthenticatedUser
  ): Promise<BookingDetailDto> {
    assertAdminRole(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.booking.findFirst({
        where: { id, deletedAt: null },
      });
      if (!existing) {
        throw new EntityNotFoundException("Lịch hẹn", id);
      }

      if (existing.version !== dto.expectedVersion) {
        throw new EntityConflictException(
          "Dữ liệu đơn hàng vừa thay đổi. Vui lòng tải lại trước khi đối soát."
        );
      }

      const nextPaymentStatus = assertValidPaymentAction({
        currentStatus: existing.paymentStatus as PaymentStatusValue,
        action: dto.action,
        reason: dto.reason,
      });

      const updated = await client.booking.updateMany({
        where: { id, version: dto.expectedVersion, deletedAt: null },
        data: {
          paymentStatus: nextPaymentStatus,
          paymentMethod: dto.method,
          version: { increment: 1 },
        },
      });
      if (updated.count === 0) {
        throw new EntityConflictException("Xung đột phiên bản khi ghi nhận thanh toán.");
      }

      await client.bookingPaymentLog.create({
        data: {
          id: generateUuidV7(),
          bookingId: id,
          action: dto.action,
          method: dto.method,
          amountVnd: existing.totalVnd,
          referenceCode: dto.referenceCode?.trim() || null,
          reason: dto.reason?.trim() || null,
          recordedByUserId: actor.id,
          recordedByEmail: actor.email,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName:
          dto.action === "CAPTURE"
            ? "admin.booking.payment_captured"
            : "admin.booking.payment_refunded",
        resourceType: "Booking",
        resourceId: id,
        payload: {
          orderCode: existing.orderCode,
          amountVnd: existing.totalVnd,
          method: dto.method,
          referenceCode: dto.referenceCode ?? null,
        },
      });
    });

    const detail = await this.bookingRepo.findDetailById(id);
    if (!detail) throw new EntityNotFoundException("Lịch hẹn", id);
    return detail;
  }
}

@Injectable()
export class AdjustBookingWorkOrderUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepo: IBookingRepository,
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  async addItem(
    bookingId: string,
    dto: AddBookingItemDto,
    actor: AuthenticatedUser
  ): Promise<BookingDetailDto> {
    assertAdminRole(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.booking.findFirst({
        where: { id: bookingId, deletedAt: null },
        include: { items: true },
      });
      if (!existing) {
        throw new EntityNotFoundException("Lịch hẹn", bookingId);
      }

      if (TERMINAL_BOOKING_STATUSES.includes(existing.status as BookingStatusValue)) {
        throw new BusinessRuleViolationException(
          "Không thể thêm hạng mục phát sinh khi đơn đã kết thúc.",
          "BOOKING_TERMINAL_READONLY"
        );
      }

      if (existing.version !== dto.expectedVersion) {
        throw new EntityConflictException(
          "Phiên bản đơn hàng không khớp. Vui lòng tải lại trang."
        );
      }

      const product = await client.serviceProduct.findFirst({
        where: { id: dto.serviceProductId, deletedAt: null },
      });
      if (!product) {
        throw new EntityNotFoundException("Gói dịch vụ", dto.serviceProductId);
      }

      const garageService = await client.garageService.findUnique({
        where: {
          garageId_serviceProductId: {
            garageId: existing.garageId,
            serviceProductId: product.id,
          },
        },
      });

      const unitPriceVnd =
        dto.customUnitPriceVnd ?? garageService?.customPriceVnd ?? product.priceVnd;
      const quantity = dto.quantity ?? 1;
      const lineTotalVnd = unitPriceVnd * quantity;

      await client.bookingItem.create({
        data: {
          id: generateUuidV7(),
          bookingId,
          serviceProductId: product.id,
          serviceNameSnap: product.name,
          skuSnap: product.sku,
          unitPriceVnd,
          quantity,
          lineTotalVnd,
        },
      });

      const nextSubtotal =
        existing.items.reduce((sum, item) => sum + item.lineTotalVnd, 0) +
        lineTotalVnd;
      const nextTotal = Math.max(0, nextSubtotal - existing.discountVnd);

      const updated = await client.booking.updateMany({
        where: { id: bookingId, version: dto.expectedVersion, deletedAt: null },
        data: {
          subtotalVnd: nextSubtotal,
          totalVnd: nextTotal,
          ...(dto.markWaitingApproval
            ? {
                status: "WAITING_APPROVAL",
                customerApprovalStatus: "PENDING",
              }
            : {}),
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new EntityConflictException("Xung đột phiên bản khi thêm hạng mục.");
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.booking.item_added",
        resourceType: "Booking",
        resourceId: bookingId,
        payload: { sku: product.sku, quantity, unitPriceVnd, nextTotal },
      });
    });

    const detail = await this.bookingRepo.findDetailById(bookingId);
    if (!detail) throw new EntityNotFoundException("Lịch hẹn", bookingId);
    return detail;
  }

  async removeItem(
    bookingId: string,
    itemId: string,
    expectedVersion: number,
    actor: AuthenticatedUser
  ): Promise<BookingDetailDto> {
    assertAdminRole(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.booking.findFirst({
        where: { id: bookingId, deletedAt: null },
        include: { items: true },
      });
      if (!existing) {
        throw new EntityNotFoundException("Lịch hẹn", bookingId);
      }

      if (TERMINAL_BOOKING_STATUSES.includes(existing.status as BookingStatusValue)) {
        throw new BusinessRuleViolationException(
          "Không thể xóa hạng mục khi đơn đã kết thúc.",
          "BOOKING_TERMINAL_READONLY"
        );
      }

      if (existing.version !== expectedVersion) {
        throw new EntityConflictException("Phiên bản đơn hàng không khớp.");
      }

      if (existing.items.length <= 1) {
        throw new BusinessRuleViolationException(
          "Lịch hẹn phải giữ lại ít nhất 1 hạng mục dịch vụ.",
          "BOOKING_MIN_ONE_ITEM"
        );
      }

      const targetItem = existing.items.find((i) => i.id === itemId);
      if (!targetItem) {
        throw new EntityNotFoundException("Hạng mục dịch vụ", itemId);
      }

      await client.bookingItem.delete({ where: { id: itemId } });

      const nextSubtotal = existing.items
        .filter((i) => i.id !== itemId)
        .reduce((sum, item) => sum + item.lineTotalVnd, 0);
      const nextTotal = Math.max(0, nextSubtotal - existing.discountVnd);

      const updated = await client.booking.updateMany({
        where: { id: bookingId, version: expectedVersion, deletedAt: null },
        data: {
          subtotalVnd: nextSubtotal,
          totalVnd: nextTotal,
          version: { increment: 1 },
        },
      });
      if (updated.count === 0) {
        throw new EntityConflictException("Xung đột phiên bản khi xóa hạng mục.");
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.booking.item_removed",
        resourceType: "Booking",
        resourceId: bookingId,
        payload: { removedSku: targetItem.skuSnap, nextTotal },
      });
    });

    const detail = await this.bookingRepo.findDetailById(bookingId);
    if (!detail) throw new EntityNotFoundException("Lịch hẹn", bookingId);
    return detail;
  }
}

@Injectable()
export class RecordBookingInspectionUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepo: IBookingRepository,
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  async execute(
    bookingId: string,
    dto: RecordBookingInspectionDto,
    actor: AuthenticatedUser
  ): Promise<BookingDetailDto> {
    assertAdminRole(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.booking.findFirst({
        where: { id: bookingId, deletedAt: null },
      });
      if (!existing) {
        throw new EntityNotFoundException("Lịch hẹn", bookingId);
      }

      const inspectionId = generateUuidV7();
      await client.bookingInspection.create({
        data: {
          id: inspectionId,
          bookingId,
          phase: dto.phase,
          odoKm: dto.odoKm ?? null,
          fuelLevel: dto.fuelLevel ?? null,
          checklistJson: dto.checklist ? JSON.parse(JSON.stringify(dto.checklist)) : [],
          photoUrls: dto.photoUrls ?? [],
          notes: dto.notes?.trim() || null,
          inspectedByUserId: actor.id,
          inspectedByEmail: actor.email,
        },
      });

      if (dto.odoKm !== undefined) {
        await client.booking.update({
          where: { id: bookingId },
          data: { odoKm: dto.odoKm },
        });
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.booking.inspection_recorded",
        resourceType: "Booking",
        resourceId: bookingId,
        payload: {
          inspectionId,
          phase: dto.phase,
          photoCount: dto.photoUrls?.length ?? 0,
        },
      });
    });

    const detail = await this.bookingRepo.findDetailById(bookingId);
    if (!detail) throw new EntityNotFoundException("Lịch hẹn", bookingId);
    return detail;
  }
}

