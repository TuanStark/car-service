import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CheckPolicies } from "@core/decorators/check-policies.decorator";
import { PoliciesGuard } from "@core/guards/policies.guard";
import { CrmUseCases } from "../application/use-cases/crm.use-cases";

@ApiTags("Admin CRM Retention")
@ApiBearerAuth()
@Controller({ path: "admin/crm", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminCrmController {
  constructor(private readonly crm: CrmUseCases) {}

  @Get("reminders")
  @ApiOperation({ summary: "[Admin] Danh sách xe sắp đến hạn bảo dưỡng (theo ODO & ngày)" })
  async getReminders() {
    return this.crm.listMaintenanceReminders();
  }
}

