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
import { CheckPolicies } from "@core/decorators/check-policies.decorator";
import {
  type AuthenticatedUser,
  CurrentUser,
} from "@core/decorators/current-user.decorator";
import { PoliciesGuard } from "@core/guards/policies.guard";
import {
  CheckoutToolDto,
  CreateEquipmentDto,
  EquipmentQueryDto,
  RecordEquipmentMaintenanceDto,
  ReturnToolDto,
  UpdateEquipmentDto,
} from "../application/dto/equipment.dto";
import { EquipmentUseCases } from "../application/use-cases/equipment.use-cases";

@ApiTags("Admin Equipment & Tools")
@ApiBearerAuth()
@Controller({ path: "admin/equipment", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminEquipmentController {
  constructor(private readonly equipment: EquipmentUseCases) {}

  @Get()
  @ApiOperation({ summary: "[Admin] Danh sách thiết bị xưởng & dụng cụ chuyên dụng" })
  async list(@Query() query: EquipmentQueryDto) {
    return this.equipment.listEquipment(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Thêm thiết bị / công cụ mới" })
  async create(
    @Body() dto: CreateEquipmentDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.equipment.createEquipment(dto, actor);
  }

  @Patch(":id")
  @ApiOperation({ summary: "[Admin] Cập nhật trạng thái thiết bị (tự khóa cầu nâng nếu hỏng/bảo trì)" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipmentDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.equipment.updateEquipment(id, dto, actor);
  }

  @Post(":id/maintenance")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Ghi nhận nhật ký bảo trì / hiệu chuẩn thiết bị" })
  async recordMaintenance(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RecordEquipmentMaintenanceDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.equipment.recordMaintenance(id, dto, actor);
  }

  @Post(":id/checkout")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Kỹ thuật viên mượn công cụ chuyên dụng" })
  async checkout(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CheckoutToolDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.equipment.checkoutTool(id, dto, actor);
  }

  @Post(":id/return")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[Admin] Trả công cụ chuyên dụng về kho dụng cụ" })
  async returnTool(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReturnToolDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.equipment.returnTool(id, dto, actor);
  }
}

