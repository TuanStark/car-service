import { Module } from "@nestjs/common";
import {
  AdjustBookingWorkOrderUseCase,
  CreateAdminBookingUseCase,
  GetBookingDispatchScheduleUseCase,
  RecordBookingInspectionUseCase,
  RecordBookingPaymentUseCase,
  RescheduleBookingUseCase,
} from "./application/use-cases/booking-operations.use-cases";
import { GetAdminBookingDetailsUseCase } from "./application/use-cases/get-admin-booking-details.use-case";
import { GetAdminBookingListUseCase } from "./application/use-cases/get-admin-booking-list.use-case";
import { UpdateBookingStatusUseCase } from "./application/use-cases/update-booking-status.use-case";
import { BOOKING_REPOSITORY } from "./domain/repositories/booking.repository.interface";
import { PrismaBookingRepository } from "./infrastructure/prisma-booking.repository";
import { AdminBookingsController } from "./presentation/admin-bookings.controller";

@Module({
  controllers: [AdminBookingsController],
  providers: [
    GetAdminBookingListUseCase,
    GetAdminBookingDetailsUseCase,
    UpdateBookingStatusUseCase,
    GetBookingDispatchScheduleUseCase,
    CreateAdminBookingUseCase,
    RescheduleBookingUseCase,
    RecordBookingPaymentUseCase,
    AdjustBookingWorkOrderUseCase,
    RecordBookingInspectionUseCase,
    {
      provide: BOOKING_REPOSITORY,
      useClass: PrismaBookingRepository,
    },
  ],
  exports: [GetAdminBookingListUseCase, GetAdminBookingDetailsUseCase],
})
export class BookingsModule {}
