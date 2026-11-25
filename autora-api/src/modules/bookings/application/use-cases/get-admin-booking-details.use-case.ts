import { Inject, Injectable } from "@nestjs/common";
import { EntityNotFoundException } from "@core/exceptions/domain.exception";
import {
  BOOKING_REPOSITORY,
  type BookingDetailDto,
  type IBookingRepository,
} from "../../domain/repositories/booking.repository.interface";

@Injectable()
export class GetAdminBookingDetailsUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepo: IBookingRepository
  ) {}

  async execute(id: string): Promise<BookingDetailDto> {
    const detail = await this.bookingRepo.findDetailById(id);
    if (!detail) {
      throw new EntityNotFoundException("Lịch hẹn dịch vụ", id);
    }
    return detail;
  }
}

