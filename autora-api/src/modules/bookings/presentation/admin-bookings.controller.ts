import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CheckPolicies } from "@core/decorators/check-policies.decorator";
import {
  type AuthenticatedUser,
  CurrentUser,
} from "@core/decorators/current-user.decorator";
import { PoliciesGuard } from "@core/guards/policies.guard";
import {
  AdminBookingQueryDto,
  UpdateBookingStatusDto,
} from "../application/dto/admin-booking.dto";
import { GetAdminBookingDetailsUseCase } from "../application/use-cases/get-admin-booking-details.use-case";
import { GetAdminBookingListUseCase } from "../application/use-cases/get-admin-booking-list.use-case";
import { UpdateBookingStatusUseCase } from "../application/use-cases/update-booking-status.use-case";

@ApiTags("Admin Bookings")
@ApiBearerAuth()
@Controller({ path: "admin/bookings", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminBookingsController {
  constructor(
    private readonly getBookingList: GetAdminBookingListUseCase,
    private readonly getBookingDetails: GetAdminBookingDetailsUseCase,
    private readonly updateBookingStatus: UpdateBookingStatusUseCase
  ) {}

  @Get()
  @ApiOperation({ summary: "[Admin] Danh sách lịch hẹn có phân trang & bộ lọc" })
  async listBookings(@Query() query: AdminBookingQueryDto) {
    return this.getBookingList.execute(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "[Admin] Chi tiết lịch hẹn & lịch sử trạng thái" })
  async getBookingDetail(@Param("id", ParseUUIDPipe) id: string) {
    return this.getBookingDetails.execute(id);
  }

  @Patch(":id/status")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: "[Admin] Cập nhật trạng thái lịch hẹn theo State Machine",
  })
  async patchBookingStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.updateBookingStatus.execute(id, dto, actor);
  }
}

