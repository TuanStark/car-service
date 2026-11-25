import { Module } from "@nestjs/common";
import { CreateGarageUseCase } from "./application/use-cases/create-garage.use-case";
import { GetAdminGarageDetailsUseCase } from "./application/use-cases/get-admin-garage-details.use-case";
import { GetAdminGarageListUseCase } from "./application/use-cases/get-admin-garage-list.use-case";
import {
  UpdateGarageStatusUseCase,
  UpdateGarageUseCase,
} from "./application/use-cases/update-garage.use-case";
import { GARAGE_REPOSITORY } from "./domain/repositories/garage.repository.interface";
import { PrismaGarageRepository } from "./infrastructure/prisma-garage.repository";
import { AdminGaragesController } from "./presentation/admin-garages.controller";

@Module({
  controllers: [AdminGaragesController],
  providers: [
    GetAdminGarageListUseCase,
    GetAdminGarageDetailsUseCase,
    CreateGarageUseCase,
    UpdateGarageUseCase,
    UpdateGarageStatusUseCase,
    {
      provide: GARAGE_REPOSITORY,
      useClass: PrismaGarageRepository,
    },
  ],
  exports: [GetAdminGarageListUseCase, GetAdminGarageDetailsUseCase],
})
export class GaragesModule {}

