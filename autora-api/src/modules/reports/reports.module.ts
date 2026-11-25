import { Module } from "@nestjs/common";
import { ReportsUseCases } from "./application/use-cases/reports.use-cases";
import { AdminReportsController } from "./presentation/admin-reports.controller";

@Module({
  controllers: [AdminReportsController],
  providers: [ReportsUseCases],
  exports: [ReportsUseCases],
})
export class ReportsModule {}

