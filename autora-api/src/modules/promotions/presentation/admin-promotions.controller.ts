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
  CouponQueryDto,
  CreateCouponDto,
  UpdateCouponDto,
} from "../application/dto/promotion.dto";
import { PromotionsUseCases } from "../application/use-cases/promotions.use-cases";

@ApiTags("Admin Promotions")
@ApiBearerAuth()
@Controller({ path: "admin/promotions", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminPromotionsController {
  constructor(private readonly promotions: PromotionsUseCases) {}

  @Get()
  @ApiOperation({ summary: "[Admin] Danh sách mã khuyến mãi & voucher" })
  async list(@Query() query: CouponQueryDto) {
    return this.promotions.listCoupons(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "[Admin] Tạo mã khuyến mãi mới" })
  async create(
    @Body() dto: CreateCouponDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.promotions.createCoupon(dto, actor);
  }

  @Patch(":id")
  @ApiOperation({ summary: "[Admin] Cập nhật hoặc bật/tắt mã khuyến mãi" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.promotions.updateCoupon(id, dto, actor);
  }
}

