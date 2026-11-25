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
  AdminServiceQueryDto,
  CreateServiceDto,
  ToggleServiceStatusDto,
  UpdateServiceDto,
} from "../application/dto/admin-service.dto";
import { AdminServicesUseCases } from "../application/use-cases/admin-services.use-cases";

@ApiTags("Admin Services")
@ApiBearerAuth()
@Controller({ path: "admin/services", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminServicesController {
  constructor(private readonly adminServices: AdminServicesUseCases) {}

  @Get("categories")
  @ApiOperation({ summary: "[Admin] Danh sách danh mục dịch vụ" })
  async listCategories() {
    return this.adminServices.listCategories();
  }

  @Get()
  @ApiOperation({ summary: "[Admin] Danh sách gói dịch vụ (bao gồm đang tạm ngưng)" })
  async listServices(@Query() query: AdminServiceQueryDto) {
    return this.adminServices.listAdmin(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "[Admin] Chi tiết gói dịch vụ theo ID" })
  async getServiceDetail(@Param("id", ParseUUIDPipe) id: string) {
    return this.adminServices.getById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Tạo mới gói dịch vụ" })
  async create(
    @Body() dto: CreateServiceDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.adminServices.create(dto, actor);
  }

  @Patch(":id")
  @ApiOperation({ summary: "[Admin] Cập nhật gói dịch vụ & giá" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.adminServices.update(id, dto, actor);
  }

  @Patch(":id/status")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: "[Admin] Kích hoạt hoặc tạm ngưng gói dịch vụ" })
  async toggleStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ToggleServiceStatusDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.adminServices.toggleActive(id, dto.isActive, actor);
  }
}

