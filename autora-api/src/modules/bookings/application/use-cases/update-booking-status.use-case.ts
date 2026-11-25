import { Inject, Injectable } from "@nestjs/common";
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
      return refreshed;
    });
  }
}

