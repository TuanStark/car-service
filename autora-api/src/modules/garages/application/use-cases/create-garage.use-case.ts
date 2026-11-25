import { Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import { ForbiddenDomainException } from "@core/exceptions/domain.exception";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import { assertValidGarageRules } from "../../domain/rules/garage.rule";
import {
  GARAGE_REPOSITORY,
  type GarageDetailDto,
  type IGarageRepository,
} from "../../domain/repositories/garage.repository.interface";
import type { CreateGarageDto } from "../dto/admin-garage.dto";

@Injectable()
export class CreateGarageUseCase {
  constructor(
    @Inject(GARAGE_REPOSITORY)
    private readonly garageRepo: IGarageRepository,
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  async execute(
    dto: CreateGarageDto,
    actor: AuthenticatedUser
  ): Promise<GarageDetailDto> {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép tạo mới garage."
      );
    }

    const status = dto.status ?? "ACTIVE";
    const isFeatured = dto.isFeatured ?? false;

    assertValidGarageRules({
      bayCount: dto.bayCount,
      startingPriceVnd: dto.startingPriceVnd,
      status,
      isFeatured,
    });

    return this.uow.runInTransaction(async () => {
      const created = await this.garageRepo.create({
        id: generateUuidV7(),
        slug: dto.slug.trim(),
        name: dto.name.trim(),
        district: dto.district.trim(),
        cityCode: dto.cityCode,
        cityLabel: dto.cityLabel.trim(),
        fullAddress: dto.fullAddress.trim(),
        phone: dto.phone?.trim(),
        verified: dto.verified ?? false,
        status,
        isFeatured,
        coverImageUrl: dto.coverImageUrl?.trim() || "/images/featured-garage.jpg",
        openHours: dto.openHours.trim(),
        bayCount: dto.bayCount,
        startingPriceVnd: dto.startingPriceVnd,
        certifications: dto.certifications ?? [],
        summary: dto.summary.trim(),
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.garage.created",
        resourceType: "Garage",
        resourceId: created.id,
        payload: { slug: created.slug, name: created.name },
      });

      return created;
    });
  }
}

