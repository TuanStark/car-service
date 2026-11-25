import { Module } from "@nestjs/common";
import { CrmUseCases } from "./application/use-cases/crm.use-cases";
import { AdminCrmController } from "./presentation/admin-crm.controller";

@Module({
  controllers: [AdminCrmController],
  providers: [CrmUseCases],
  exports: [CrmUseCases],
})
export class CrmModule {}

