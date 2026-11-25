import {
  Body,
  Controller,
  Get,
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
  ReplyReviewDto,
  ReviewQueryDto,
  ToggleReviewHiddenDto,
} from "../application/dto/review.dto";
import { ReviewsUseCases } from "../application/use-cases/reviews.use-cases";

@ApiTags("Admin Reviews Moderation")
@ApiBearerAuth()
@Controller({ path: "admin/reviews", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsUseCases) {}

  @Get()
  @ApiOperation({ summary: "[Admin] Hàng chờ kiểm duyệt đánh giá khách hàng" })
  async list(@Query() query: ReviewQueryDto) {
    return this.reviews.listReviews(query);
  }

  @Post(":id/reply")
  @ApiOperation({ summary: "[Admin] Phản hồi đánh giá từ Garage / Admin" })
  async reply(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReplyReviewDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.reviews.replyReview(id, dto, actor);
  }

  @Patch(":id/hidden")
  @ApiOperation({ summary: "[Admin] Ẩn/hiện đánh giá vi phạm & tính lại điểm trung bình" })
  async toggleHidden(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ToggleReviewHiddenDto,
    @CurrentUser() actor: AuthenticatedUser
  ) {
    return this.reviews.toggleHidden(id, dto.isHidden, actor);
  }
}

