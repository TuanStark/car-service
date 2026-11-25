import { Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import {
  EntityNotFoundException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import { assertValidGarageRules } from "../../domain/rules/garage.rule";
import {
  GARAGE_REPOSITORY,
  type GarageDetailDto,
  type IGarageRepository,
} from "../../domain/repositories/garage.repository.interface";
import type {
  UpdateGarageDto,
  UpdateGarageStatusDto,
} from "../dto/admin-garage.dto";

@Injectable()
export class UpdateGarageUseCase {
  constructor(
    @Inject(GARAGE_REPOSITORY)
    private readonly garageRepo: IGarageRepository,
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  async execute(
    id: string,
    dto: UpdateGarageDto,
    actor: AuthenticatedUser
  ): Promise<GarageDetailDto> {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép cập nhật thông tin garage."
      );
    }

    return this.uow.runInTransaction(async () => {
      const existing = await this.garageRepo.findDetailById(id);
      if (!existing) {
        throw new EntityNotFoundException("Garage", id);
      }

      assertValidGarageRules({
        bayCount: dto.bayCount ?? existing.bayCount,
        startingPriceVnd: dto.startingPriceVnd ?? existing.startingPriceVnd,
        status: existing.status,
        isFeatured: dto.isFeatured ?? existing.isFeatured,
      });

      const updated = await this.garageRepo.update(id, dto);
      if (!updated) {
        throw new EntityNotFoundException("Garage", id);
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.garage.updated",
        resourceType: "Garage",
        resourceId: id,
        payload: { updatedFields: Object.keys(dto) },
      });

      return updated;
    });
  }
}

@Injectable()
export class UpdateGarageStatusUseCase {
  constructor(
    @Inject(GARAGE_REPOSITORY)
    private readonly garageRepo: IGarageRepository,
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  async execute(
    id: string,
    dto: UpdateGarageStatusDto,
    actor: AuthenticatedUser
  ): Promise<GarageDetailDto> {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép thay đổi trạng thái garage."
      );
    }

    return this.uow.runInTransaction(async () => {
      const existing = await this.garageRepo.findDetailById(id);
      if (!existing) {
        throw new EntityNotFoundException("Garage", id);
      }

      const nextStatus = dto.status ?? existing.status;
      if (nextStatus === "SUSPENDED" && existing.isFeatured) {
        await this.garageRepo.update(id, { isFeatured: false });
      }

      const updated = await this.garageRepo.updateStatus(id, dto);
      if (!updated) {
        throw new EntityNotFoundException("Garage", id);
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.garage.status_updated",
        resourceType: "Garage",
        resourceId: id,
        payload: {
          fromStatus: existing.status,
          toStatus: updated.status,
          verified: updated.verified,
        },
      });

      return updated;
    });
  }
}

