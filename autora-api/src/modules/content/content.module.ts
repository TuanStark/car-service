import { Module } from "@nestjs/common";
import { ContentUseCases } from "./application/use-cases/content.use-cases";
import {
  AdminContentController,
  PublicContentController,
} from "./presentation/admin-content.controller";

@Module({
  controllers: [AdminContentController, PublicContentController],
  providers: [ContentUseCases],
  exports: [ContentUseCases],
})
export class ContentModule {}

