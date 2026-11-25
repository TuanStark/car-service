import { Module } from "@nestjs/common";
import { ProcurementUseCases } from "./application/use-cases/procurement.use-cases";
import { AdminProcurementController } from "./presentation/admin-procurement.controller";

@Module({
  controllers: [AdminProcurementController],
  providers: [ProcurementUseCases],
  exports: [ProcurementUseCases],
})
export class ProcurementModule {}

