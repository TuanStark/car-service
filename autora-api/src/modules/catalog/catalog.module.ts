import { Module } from "@nestjs/common";
import { GetServiceBySlugUseCase } from "./application/use-cases/get-service-by-slug.use-case";
import { ListServicesUseCase } from "./application/use-cases/list-services.use-case";
import { SERVICE_PRODUCT_REPOSITORY } from "./domain/repositories/service-product.repository.interface";
import { PrismaServiceProductRepository } from "./infrastructure/prisma-service-product.repository";
import { CatalogController } from "./presentation/catalog.controller";

@Module({
  controllers: [CatalogController],
  providers: [
    ListServicesUseCase,
    GetServiceBySlugUseCase,
    {
      provide: SERVICE_PRODUCT_REPOSITORY,
      useClass: PrismaServiceProductRepository,
    },
  ],
  exports: [ListServicesUseCase, GetServiceBySlugUseCase],
})
export class CatalogModule {}
