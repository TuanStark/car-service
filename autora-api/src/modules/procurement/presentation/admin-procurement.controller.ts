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
  CreatePoDto,
  CreateSupplierDto,
  PoQueryDto,
  ReceivePoDto,
  SupplierQueryDto,
  UpdatePoStatusDto,
  UpdateSupplierDto,
} from "../application/dto/procurement.dto";
import { ProcurementUseCases } from "../application/use-cases/procurement.use-cases";

@ApiTags("Admin Suppliers & Purchase Orders")
@ApiBearerAuth()
@Controller({ path: "admin", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminProcurementController {
  constructor(private readonly procurement: ProcurementUseCases) {}

  @Get("suppliers")
  @ApiOperation({ summary: "[Admin] Danh sách nhà cung cấp phụ tùng" })
  async listSuppliers(@Query() query: SupplierQueryDto) {
    return this.procurement.listSuppliers(query);
  }

  @Post("suppliers")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Thêm nhà cung cấp mới" })
  async createSupplier(
    @Body() dto: CreateSupplierDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.procurement.createSupplier(dto, actor);
  }

  @Patch("suppliers/:id")
  @ApiOperation({ summary: "[Admin] Cập nhật thông tin nhà cung cấp" })
  async updateSupplier(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.procurement.updateSupplier(id, dto, actor);
  }

  @Get("purchase-orders")
  @ApiOperation({ summary: "[Admin] Danh sách phiếu nhập kho (PO)" })
  async listPos(@Query() query: PoQueryDto) {
    return this.procurement.listPurchaseOrders(query);
  }

  @Get("purchase-orders/:id")
  @ApiOperation({ summary: "[Admin] Chi tiết phiếu nhập kho (PO)" })
  async getPo(@Param("id", ParseUUIDPipe) id: string) {
    return this.procurement.getPurchaseOrderById(id);
  }

  @Post("purchase-orders")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Tạo phiếu nhập hàng nhà cung cấp (PO)" })
  async createPo(
    @Body() dto: CreatePoDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.procurement.createPurchaseOrder(dto, actor);
  }

  @Patch("purchase-orders/:id/status")
  @ApiOperation({ summary: "[Admin] Cập nhật trạng thái phiếu nhập kho" })
  async updatePoStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePoStatusDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.procurement.updatePoStatus(id, dto.status, actor);
  }

  @Post("purchase-orders/:id/receive")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "[Admin] Nhập kho hàng thực nhận từ PO (cộng tồn kho & tính giá vốn bình quân)",
  })
  async receivePo(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReceivePoDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.procurement.receivePurchaseOrder(id, dto, actor);
  }
}

