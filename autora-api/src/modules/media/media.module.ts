import { Module } from "@nestjs/common";
import { PresignCloudinaryUploadUseCase } from "./application/use-cases/presign-cloudinary-upload.use-case";
import { AdminMediaController } from "./presentation/admin-media.controller";

@Module({
  controllers: [AdminMediaController],
  providers: [PresignCloudinaryUploadUseCase],
})
export class MediaModule {}
