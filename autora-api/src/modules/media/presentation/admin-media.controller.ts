import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CheckPolicies } from "@core/decorators/check-policies.decorator";
import {
  type AuthenticatedUser,
  CurrentUser,
} from "@core/decorators/current-user.decorator";
import { PoliciesGuard } from "@core/guards/policies.guard";
import {
  type CloudinaryPresignResponseDto,
  PresignCloudinaryUploadUseCase,
  PresignUploadDto,
} from "../application/use-cases/presign-cloudinary-upload.use-case";

@ApiTags("Admin Media")
@ApiBearerAuth()
@Controller({ path: "admin/media", version: "1" })
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can("manage", "all"))
export class AdminMediaController {
  constructor(private readonly presignUpload: PresignCloudinaryUploadUseCase) {}

  @Post("presign")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  @ApiOperation({
    summary:
      "[Admin] Cấp chữ ký presigned upload trực tiếp lên Cloudinary (giảm tải backend)",
  })
  async createPresignedUpload(
    @Body() dto: PresignUploadDto,
    @CurrentUser() actor: AuthenticatedUser
  ): Promise<CloudinaryPresignResponseDto> {
    return this.presignUpload.execute(dto, actor);
  }
}
