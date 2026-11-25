import { Inject, Injectable } from "@nestjs/common";
import type { PaginatedResult } from "@core/domain/repository.interface";
import {
  BOOKING_REPOSITORY,
  type BookingListItemDto,
  type IBookingRepository,
} from "../../domain/repositories/booking.repository.interface";
import type { AdminBookingQueryDto } from "../dto/admin-booking.dto";

@Injectable()
export class GetAdminBookingListUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepo: IBookingRepository
  ) {}

  async execute(
    query: AdminBookingQueryDto
  ): Promise<PaginatedResult<BookingListItemDto>> {
    return this.bookingRepo.findManyAdmin({
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      garageId: query.garageId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
}

