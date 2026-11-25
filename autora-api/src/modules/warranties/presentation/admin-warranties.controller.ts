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
  CreateWarrantyClaimDto,
  UpdateWarrantyClaimDto,
  WarrantyQueryDto,
} from "../application/dto/warranty.dto";
import { WarrantiesUseCases } from "../application/use-cases/warranties.use-cases";

@ApiTags("Admin Warranties & Comeback Claims")
@ApiBearerAuth()
@Controller({ path: "admin/warranties", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminWarrantiesController {
  constructor(private readonly warranties: WarrantiesUseCases) {}

  @Get()
  @ApiOperation({ summary: "[Admin] Tra cứu sổ bảo hành điện tử & lịch sử comeback" })
  async list(@Query() query: WarrantyQueryDto) {
    return this.warranties.listWarranties(query);
  }

  @Post(":id/claims")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Mở phiếu xử lý bảo hành / comeback" })
  async createClaim(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateWarrantyClaimDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.warranties.createClaim(id, dto, actor);
  }

  @Patch("claims/:claimId")
  @ApiOperation({ summary: "[Admin] Cập nhật kết quả xử lý & chi phí nội bộ bảo hành" })
  async updateClaim(
    @Param("claimId", ParseUUIDPipe) claimId: string,
    @Body() dto: UpdateWarrantyClaimDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.warranties.updateClaim(claimId, dto, actor);
  }
}

