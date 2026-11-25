import { Module } from "@nestjs/common";
import { InventoryUseCases } from "./application/use-cases/inventory.use-cases";
import { AdminInventoryController } from "./presentation/admin-inventory.controller";

@Module({
  controllers: [AdminInventoryController],
  providers: [InventoryUseCases],
  exports: [InventoryUseCases],
})
export class InventoryModule {}

