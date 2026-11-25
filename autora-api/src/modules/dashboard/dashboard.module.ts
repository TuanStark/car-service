import { Module } from "@nestjs/common";
import { GetDashboardOverviewUseCase } from "./application/use-cases/get-dashboard-overview.use-case";
import { AdminDashboardController } from "./presentation/admin-dashboard.controller";

@Module({
  controllers: [AdminDashboardController],
  providers: [GetDashboardOverviewUseCase],
})
export class DashboardModule {}

