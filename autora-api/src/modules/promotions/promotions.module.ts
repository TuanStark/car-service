import { Module } from "@nestjs/common";
import { PromotionsUseCases } from "./application/use-cases/promotions.use-cases";
import { AdminPromotionsController } from "./presentation/admin-promotions.controller";

@Module({
  controllers: [AdminPromotionsController],
  providers: [PromotionsUseCases],
  exports: [PromotionsUseCases],
})
export class PromotionsModule {}

