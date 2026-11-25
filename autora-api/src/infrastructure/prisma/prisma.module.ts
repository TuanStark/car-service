import { Global, Module } from "@nestjs/common";
import { UNIT_OF_WORK } from "@core/domain/unit-of-work.interface";
import { PrismaService } from "./prisma.service";
import { PrismaUnitOfWorkService } from "./prisma-unit-of-work.service";

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaUnitOfWorkService,
    {
      provide: UNIT_OF_WORK,
      useExisting: PrismaUnitOfWorkService,
    },
  ],
  exports: [PrismaService, PrismaUnitOfWorkService, UNIT_OF_WORK],
})
export class PrismaModule {}
