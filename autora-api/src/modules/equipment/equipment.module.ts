import { Module } from "@nestjs/common";
import { EquipmentUseCases } from "./application/use-cases/equipment.use-cases";
import { AdminEquipmentController } from "./presentation/admin-equipment.controller";

@Module({
  controllers: [AdminEquipmentController],
  providers: [EquipmentUseCases],
  exports: [EquipmentUseCases],
})
export class EquipmentModule {}

