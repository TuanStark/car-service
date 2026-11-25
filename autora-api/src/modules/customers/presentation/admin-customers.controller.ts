import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CheckPolicies } from "@core/decorators/check-policies.decorator";
import { PoliciesGuard } from "@core/guards/policies.guard";
import {
  AdminCustomerQueryDto,
  AdminCustomersUseCases,
} from "../application/use-cases/admin-customers.use-cases";

@ApiTags("Admin Customers")
@ApiBearerAuth()
@Controller({ path: "admin/customers", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminCustomersController {
  constructor(private readonly adminCustomers: AdminCustomersUseCases) {}

  @Get()
  @ApiOperation({ summary: "[Admin] Danh sách khách hàng đăng ký có tìm kiếm" })
  async listCustomers(@Query() query: AdminCustomerQueryDto) {
    return this.adminCustomers.listCustomers(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "[Admin] Hồ sơ khách hàng, danh sách xe & lịch sử đặt lịch" })
  async getCustomerProfile(@Param("id", ParseUUIDPipe) id: string) {
    return this.adminCustomers.getCustomerProfile(id);
  }
}

