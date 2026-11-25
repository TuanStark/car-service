import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CheckPolicies } from "@core/decorators/check-policies.decorator";
import { PoliciesGuard } from "@core/guards/policies.guard";
import { GetDashboardOverviewUseCase } from "../application/use-cases/get-dashboard-overview.use-case";

@ApiTags("Admin Dashboard")
@ApiBearerAuth()
@Controller({ path: "admin/dashboard", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminDashboardController {
  constructor(private readonly getOverview: GetDashboardOverviewUseCase) {}

  @Get("overview")
  @ApiOperation({ summary: "[Admin] Tổng quan vận hành, doanh thu thực & cảnh báo" })
  async getDashboardOverview() {
    return this.getOverview.execute();
  }
}

