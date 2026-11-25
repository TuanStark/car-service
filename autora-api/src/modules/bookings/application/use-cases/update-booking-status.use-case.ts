import { Injectable, Inject } from "@nestjs/common";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { parseWarrantyMonths } from "@modules/warranties/application/use-cases/warranties.use-cases";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import {
  EntityConflictException,
  EntityNotFoundException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import { assertValidBookingStatusTransition } from "../../domain/booking-status-machine";
import {
  BOOKING_REPOSITORY,
  type BookingDetailDto,
  type IBookingRepository,
} from "../../domain/repositories/booking.repository.interface";
import type { UpdateBookingStatusDto } from "../dto/admin-booking.dto";

@Injectable()
export class UpdateBookingStatusUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepo: IBookingRepository,
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  async execute(
    id: string,
    dto: UpdateBookingStatusDto,
    actor: AuthenticatedUser
  ): Promise<BookingDetailDto> {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép cập nhật trạng thái lịch hẹn."
      );
    }

    return this.uow.runInTransaction(async () => {
      const existing = await this.bookingRepo.findDetailById(id);
      if (!existing) {
        throw new EntityNotFoundException("Lịch hẹn dịch vụ", id);
      }

      if (existing.version !== dto.expectedVersion) {
        throw new EntityConflictException(
          "Lịch hẹn vừa được cập nhật bởi thao tác khác. Vui lòng tải lại dữ liệu mới nhất.",
          {
            code: "BOOKING_CONCURRENT_MODIFICATION",
            expectedVersion: dto.expectedVersion,
            currentVersion: existing.version,
          }
        );
      }

      assertValidBookingStatusTransition({
        from: existing.status,
        to: dto.status,
        reason: dto.reason,
      });

      const updated = await this.bookingRepo.transitionStatusWithVersion({
        id,
        fromStatus: existing.status,
        toStatus: dto.status,
        expectedVersion: dto.expectedVersion,
        reason: dto.reason?.trim() || undefined,
        changedByUserId: actor.id,
        changedByEmail: actor.email,
      });

      if (!updated) {
        throw new EntityConflictException(
          "Không thể cập nhật do xung đột phiên bản lịch hẹn. Vui lòng thử lại.",
          { code: "BOOKING_CONCURRENT_MODIFICATION" }
        );
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.booking.status_updated",
        resourceType: "Booking",
        resourceId: id,
        payload: {
          orderCode: existing.orderCode,
          fromStatus: existing.status,
          toStatus: dto.status,
          reason: dto.reason?.trim() || null,
        },
      });

      const refreshed = await this.bookingRepo.findDetailById(id);
      if (!refreshed) {
        throw new EntityNotFoundException("Lịch hẹn dịch vụ", id);
      }

      if (dto.status === "COMPLETED" && typeof this.uow.getClient === "function") {
        const client = this.uow.getClient();
        const existingWarranties = await client.warrantyRecord.count({
          where: { bookingId: id },
        });
        if (existingWarranties === 0 && refreshed.items.length > 0) {
          for (const item of refreshed.items) {
            const svc = item.serviceProductId
              ? await client.serviceProduct.findUnique({
                  where: { id: item.serviceProductId },
                  select: { warrantyLabel: true },
                })
              : null;
            const label = svc?.warrantyLabel ?? "6 tháng / 5.000 km";
            const months = parseWarrantyMonths(label);
            const startsAt = new Date();
            const validUntil = new Date(startsAt);
            validUntil.setMonth(validUntil.getMonth() + months);

            await client.warrantyRecord.create({
              data: {
                id: generateUuidV7(),
                warrantyCode: `BH-${refreshed.orderCode.slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
                bookingId: refreshed.id,
                vehicleId: refreshed.vehicleId,
                garageId: refreshed.garageId,
                serviceProductId: item.serviceProductId,
                serviceNameSnap: item.serviceNameSnap,
                licensePlate: refreshed.licensePlate,
                customerName: refreshed.customerName,
                warrantyLabel: label,
                startsAt,
                validUntilDate: validUntil,
                startOdoKm: refreshed.odoKm,
                validUntilOdoKm: refreshed.odoKm + 10_000,
                status: "ACTIVE",
              },
            });
          }
        }
      }

      return refreshed;
    });
  }
}

