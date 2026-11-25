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
  Put,
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
  AdminGarageQueryDto,
  CreateGarageBayDto,
  CreateGarageDto,
  SyncGarageServicesDto,
  UpdateGarageBayDto,
  UpdateGarageDto,
  UpdateGarageStatusDto,
} from "../application/dto/admin-garage.dto";
import { CreateGarageUseCase } from "../application/use-cases/create-garage.use-case";
import {
  ManageGarageBaysUseCase,
  SyncGarageServicesUseCase,
} from "../application/use-cases/garage-operations.use-cases";
import { GetAdminGarageDetailsUseCase } from "../application/use-cases/get-admin-garage-details.use-case";
import { GetAdminGarageListUseCase } from "../application/use-cases/get-admin-garage-list.use-case";
import {
  UpdateGarageStatusUseCase,
  UpdateGarageUseCase,
} from "../application/use-cases/update-garage.use-case";

@ApiTags("Admin Garages")
@ApiBearerAuth()
@Controller({ path: "admin/garages", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminGaragesController {
  constructor(
    private readonly getGarageList: GetAdminGarageListUseCase,
    private readonly getGarageDetails: GetAdminGarageDetailsUseCase,
    private readonly createGarage: CreateGarageUseCase,
    private readonly updateGarage: UpdateGarageUseCase,
    private readonly updateGarageStatus: UpdateGarageStatusUseCase,
    private readonly manageBays: ManageGarageBaysUseCase,
    private readonly syncServices: SyncGarageServicesUseCase
  ) {}

  @Get()
  @ApiOperation({ summary: "[Admin] Danh sách garage đối tác có phân trang & bộ lọc" })
  async listGarages(@Query() query: AdminGarageQueryDto) {
    return this.getGarageList.execute(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "[Admin] Chi tiết garage, dịch vụ hỗ trợ & lịch hẹn gần đây" })
  async getGarageDetail(@Param("id", ParseUUIDPipe) id: string) {
    return this.getGarageDetails.execute(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Thêm mới garage đối tác" })
  async create(
    @Body() dto: CreateGarageDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.createGarage.execute(dto, actor);
  }

  @Patch(":id")
  @ApiOperation({ summary: "[Admin] Cập nhật thông tin hồ sơ garage" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateGarageDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.updateGarage.execute(id, dto, actor);
  }

  @Patch(":id/status")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: "[Admin] Cập nhật trạng thái hoạt động & xác minh garage" })
  async updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateGarageStatusDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.updateGarageStatus.execute(id, dto, actor);
  }

  @Post(":id/bays")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Thêm cầu nâng / khoang dịch vụ cho garage" })
  async addBay(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateGarageBayDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.manageBays.createBay(id, dto, actor);
  }

  @Patch(":id/bays/:bayId")
  @ApiOperation({ summary: "[Admin] Cập nhật thông tin / trạng thái cầu nâng" })
  async updateBay(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("bayId", ParseUUIDPipe) bayId: string,
    @Body() dto: UpdateGarageBayDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.manageBays.updateBay(id, bayId, dto, actor);
  }

  @Delete(":id/bays/:bayId")
  @ApiOperation({ summary: "[Admin] Xóa cầu nâng khỏi garage" })
  async deleteBay(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("bayId", ParseUUIDPipe) bayId: string,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.manageBays.deleteBay(id, bayId, actor);
  }

  @Put(":id/services")
  @ApiOperation({ summary: "[Admin] Đồng bộ ma trận dịch vụ & giá riêng theo garage" })
  async syncGarageServices(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SyncGarageServicesDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.syncServices.execute(id, dto, actor);
  }
}

