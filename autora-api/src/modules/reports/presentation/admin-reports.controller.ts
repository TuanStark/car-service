import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
  CreateExpenseDto,
  ExpenseQueryDto,
  PnlQueryDto,
} from "../application/dto/reports.dto";
import { ReportsUseCases } from "../application/use-cases/reports.use-cases";

@ApiTags("Admin Financial Reports & Cashbook")
@ApiBearerAuth()
@Controller({ path: "admin/reports", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminReportsController {
  constructor(private readonly reports: ReportsUseCases) {}

  @Get("pnl")
  @ApiOperation({ summary: "[Admin] Báo cáo Lãi/Lỗ thực tế (P&L) & Dòng tiền" })
  async getPnl(@Query() query: PnlQueryDto) {
    return this.reports.getWorkshopPnl(query);
  }

  @Get("expenses")
  @ApiOperation({ summary: "[Admin] Danh sách phiếu chi vận hành (Sổ quỹ)" })
  async listExpenses(@Query() query: ExpenseQueryDto) {
    return this.reports.listExpenses(query);
  }

  @Post("expenses")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Ghi nhận khoản chi vận hành / thanh toán NCC" })
  async createExpense(
    @Body() dto: CreateExpenseDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.reports.createExpense(dto, actor);
  }

  @Delete("expenses/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "[Admin] Xóa phiếu chi" })
  async deleteExpense(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    await this.reports.deleteExpense(id, actor);
  }
}

