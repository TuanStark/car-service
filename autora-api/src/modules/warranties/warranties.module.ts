import { Module } from "@nestjs/common";
import { WarrantiesUseCases } from "./application/use-cases/warranties.use-cases";
import { AdminWarrantiesController } from "./presentation/admin-warranties.controller";

@Module({
  controllers: [AdminWarrantiesController],
  providers: [WarrantiesUseCases],
  exports: [WarrantiesUseCases],
})
export class WarrantiesModule {}

