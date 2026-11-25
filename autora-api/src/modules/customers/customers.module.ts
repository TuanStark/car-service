import { Module } from "@nestjs/common";
import { AdminCustomersUseCases } from "./application/use-cases/admin-customers.use-cases";
import { CUSTOMER_REPOSITORY } from "./domain/repositories/customer.repository.interface";
import { PrismaCustomerRepository } from "./infrastructure/prisma-customer.repository";
import { AdminCustomersController } from "./presentation/admin-customers.controller";

@Module({
  controllers: [AdminCustomersController],
  providers: [
    AdminCustomersUseCases,
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: PrismaCustomerRepository,
    },
  ],
  exports: [AdminCustomersUseCases],
})
export class CustomersModule {}

