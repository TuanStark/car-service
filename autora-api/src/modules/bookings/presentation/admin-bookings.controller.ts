import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
  AddBookingItemDto,
  AdminBookingQueryDto,
  CreateAdminBookingDto,
  DispatchScheduleQueryDto,
  RecordBookingInspectionDto,
  RecordBookingPaymentDto,
  RemoveBookingItemDto,
  RescheduleBookingDto,
  UpdateBookingStatusDto,
} from "../application/dto/admin-booking.dto";
import {
  AdjustBookingWorkOrderUseCase,
  CreateAdminBookingUseCase,
  GetBookingDispatchScheduleUseCase,
  RecordBookingInspectionUseCase,
  RecordBookingPaymentUseCase,
  RescheduleBookingUseCase,
} from "../application/use-cases/booking-operations.use-cases";
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
    private readonly updateBookingStatus: UpdateBookingStatusUseCase,
    private readonly getSchedule: GetBookingDispatchScheduleUseCase,
    private readonly createBooking: CreateAdminBookingUseCase,
    private readonly rescheduleBooking: RescheduleBookingUseCase,
    private readonly recordPayment: RecordBookingPaymentUseCase,
    private readonly adjustWorkOrder: AdjustBookingWorkOrderUseCase,
    private readonly recordInspection: RecordBookingInspectionUseCase
  ) {}

  @Get("schedule")
  @ApiOperation({ summary: "[Admin] Lịch điều phối cầu nâng theo ngày" })
  async getDispatchSchedule(@Query() query: DispatchScheduleQueryDto) {
    return this.getSchedule.execute(query);
  }

  @Get()
  @ApiOperation({ summary: "[Admin] Danh sách lịch hẹn có phân trang & bộ lọc" })
  async listBookings(@Query() query: AdminBookingQueryDto) {
    return this.getBookingList.execute(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Tạo lịch hẹn Hotline / Walk-in" })
  async createHotlineBooking(
    @Body() dto: CreateAdminBookingDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.createBooking.execute(dto, actor);
  }

  @Get(":id")
  @ApiOperation({ summary: "[Admin] Chi tiết lịch hẹn, DVI, thanh toán & lịch sử" })
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

  @Patch(":id/reschedule")
  @ApiOperation({ summary: "[Admin] Dời lịch hẹn, chuyển Garage hoặc gán cầu nâng" })
  async patchReschedule(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RescheduleBookingDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.rescheduleBooking.execute(id, dto, actor);
  }

  @Patch(":id/payment")
  @ApiOperation({ summary: "[Admin] Ghi nhận thu tiền tại xưởng hoặc hoàn tiền" })
  async patchPayment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RecordBookingPaymentDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.recordPayment.execute(id, dto, actor);
  }

  @Post(":id/items")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Thêm hạng mục phát sinh vào Lệnh sửa chữa" })
  async addWorkOrderItem(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddBookingItemDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.adjustWorkOrder.addItem(id, dto, actor);
  }

  @Delete(":id/items/:itemId")
  @ApiOperation({ summary: "[Admin] Gỡ hạng mục khỏi Lệnh sửa chữa" })
  async removeWorkOrderItem(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("itemId", ParseUUIDPipe) itemId: string,
    @Query() query: RemoveBookingItemDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.adjustWorkOrder.removeItem(id, itemId, query.expectedVersion, actor);
  }

  @Post(":id/inspections")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Lưu biên bản kiểm tra xe DVI (Check-in / Check-out)" })
  async createInspection(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RecordBookingInspectionDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.recordInspection.execute(id, dto, actor);
  }
}
