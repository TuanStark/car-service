import { Module } from "@nestjs/common";
import { WorkforceUseCases } from "./application/use-cases/workforce.use-cases";
import { AdminWorkforceController } from "./presentation/admin-workforce.controller";

@Module({
  controllers: [AdminWorkforceController],
  providers: [WorkforceUseCases],
  exports: [WorkforceUseCases],
})
export class WorkforceModule {}

