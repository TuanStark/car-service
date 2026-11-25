import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CheckPolicies } from "@core/decorators/check-policies.decorator";
import { PoliciesGuard } from "@core/guards/policies.guard";
import {
  AdminAuditQueryDto,
  GetAdminAuditLogsUseCase,
} from "../application/use-cases/get-admin-audit-logs.use-case";

@ApiTags("Admin Audit Logs")
@ApiBearerAuth()
@Controller({ path: "admin/audit-logs", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminAuditController {
  constructor(private readonly getAuditLogs: GetAdminAuditLogsUseCase) {}

  @Get()
  @ApiOperation({ summary: "[Admin] Tra cứu nhật ký thao tác hệ thống" })
  async listAuditLogs(@Query() query: AdminAuditQueryDto) {
    return this.getAuditLogs.execute(query);
  }
}

