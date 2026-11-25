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
  CreateStaffDto,
  StaffQueryDto,
  UpdateTechnicianProfileDto,
} from "../application/dto/workforce.dto";
import { WorkforceUseCases } from "../application/use-cases/workforce.use-cases";

@ApiTags("Admin Workforce & Technicians")
@ApiBearerAuth()
@Controller({ path: "admin/staff", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminWorkforceController {
  constructor(private readonly workforce: WorkforceUseCases) {}

  @Get()
  @ApiOperation({ summary: "[Admin] Danh sách nhân sự, KTV & hiệu suất/hoa hồng" })
  async list(@Query() query: StaffQueryDto) {
    return this.workforce.listStaff(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Tạo tài khoản nhân sự / Kỹ thuật viên mới" })
  async create(
    @Body() dto: CreateStaffDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.workforce.createStaff(dto, actor);
  }

  @Patch(":id/technician")
  @ApiOperation({ summary: "[Admin] Cập nhật hồ sơ chuyên môn & hoa hồng KTV" })
  async updateTechnician(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTechnicianProfileDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.workforce.updateTechnicianProfile(id, dto, actor);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "[Admin] Khóa / mở khóa tài khoản nhân sự & thu hồi RefreshToken" })
  async toggleStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { status: "ACTIVE" | "SUSPENDED" },
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.workforce.toggleStaffStatus(id, body.status, actor);
  }
}

