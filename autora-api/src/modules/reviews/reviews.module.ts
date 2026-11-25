import { Module } from "@nestjs/common";
import { ReviewsUseCases } from "./application/use-cases/reviews.use-cases";
import { AdminReviewsController } from "./presentation/admin-reviews.controller";

@Module({
  controllers: [AdminReviewsController],
  providers: [ReviewsUseCases],
  exports: [ReviewsUseCases],
})
export class ReviewsModule {}

