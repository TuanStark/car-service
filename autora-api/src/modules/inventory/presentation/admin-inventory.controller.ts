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
  AdjustInventoryDto,
  CreatePartDto,
  InventoryQueryDto,
  MovementQueryDto,
  PartQueryDto,
  TransferInventoryDto,
  UpdatePartDto,
} from "../application/dto/inventory.dto";
import { InventoryUseCases } from "../application/use-cases/inventory.use-cases";

@ApiTags("Admin Parts & Inventory")
@ApiBearerAuth()
@Controller({ path: "admin", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminInventoryController {
  constructor(private readonly inventory: InventoryUseCases) {}

  @Get("parts")
  @ApiOperation({ summary: "[Admin] Danh mục phụ tùng & vật tư tiêu hao" })
  async listParts(@Query() query: PartQueryDto) {
    return this.inventory.listParts(query);
  }

  @Post("parts")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Thêm mã phụ tùng / vật tư mới" })
  async createPart(
    @Body() dto: CreatePartDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.inventory.createPart(dto, actor);
  }

  @Patch("parts/:id")
  @ApiOperation({ summary: "[Admin] Cập nhật thông tin phụ tùng" })
  async updatePart(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.inventory.updatePart(id, dto, actor);
  }

  @Get("inventory")
  @ApiOperation({ summary: "[Admin] Tồn kho phụ tùng theo chi nhánh" })
  async listInventory(@Query() query: InventoryQueryDto) {
    return this.inventory.listInventory(query);
  }

  @Post("inventory/adjust")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[Admin] Kiểm kê & điều chỉnh tồn kho" })
  async adjustStock(
    @Body() dto: AdjustInventoryDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.inventory.adjustStock(dto, actor);
  }

  @Post("inventory/transfer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[Admin] Chuyển kho nội bộ giữa các Garage" })
  async transferStock(
    @Body() dto: TransferInventoryDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.inventory.transferStock(dto, actor);
  }

  @Get("inventory/movements")
  @ApiOperation({ summary: "[Admin] Sổ cái Nhập - Xuất - Tồn kho" })
  async listMovements(@Query() query: MovementQueryDto) {
    return this.inventory.listMovements(query);
  }
}

