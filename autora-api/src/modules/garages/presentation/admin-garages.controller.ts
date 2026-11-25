import {
  Body,
  Controller,
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
  AdminGarageQueryDto,
  CreateGarageDto,
  UpdateGarageDto,
  UpdateGarageStatusDto,
} from "../application/dto/admin-garage.dto";
import { CreateGarageUseCase } from "../application/use-cases/create-garage.use-case";
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
    private readonly updateGarageStatus: UpdateGarageStatusUseCase
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
}

