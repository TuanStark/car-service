import { Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import type { PaginatedResult } from "@core/domain/repository.interface";
import {
  EntityNotFoundException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import type { ServiceProductProps } from "../../domain/entities/service-product.entity";
import { validateAndNormalizeServicePricing } from "../../domain/rules/service-pricing.rule";
import {
  type IServiceProductRepository,
  SERVICE_PRODUCT_REPOSITORY,
  type ServiceCategoryOptionDto,
} from "../../domain/repositories/service-product.repository.interface";
import type {
  AdminServiceQueryDto,
  CreateServiceDto,
  UpdateServiceDto,
} from "../dto/admin-service.dto";

export type ServiceProductView = { id: string } & ServiceProductProps;

@Injectable()
export class AdminServicesUseCases {
  constructor(
    @Inject(SERVICE_PRODUCT_REPOSITORY)
    private readonly serviceRepo: IServiceProductRepository,
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  async listAdmin(
    query: AdminServiceQueryDto
  ): Promise<PaginatedResult<ServiceProductView>> {
    const result = await this.serviceRepo.findManyAdmin({
      page: query.page,
      limit: query.limit,
      query: query.query,
      categoryId: query.categoryId,
      isActive: query.isActive,
    });

    return {
      items: result.items.map((item) => item.toJSON()),
      meta: result.meta,
    };
  }

  async listCategories(): Promise<readonly ServiceCategoryOptionDto[]> {
    return this.serviceRepo.listCategories();
  }

  async getById(id: string): Promise<ServiceProductView> {
    const found = await this.serviceRepo.findById(id);
    if (!found) {
      throw new EntityNotFoundException("Gói dịch vụ", id);
    }
    return found.toJSON();
  }

  async create(
    dto: CreateServiceDto,
    actor: AuthenticatedUser
  ): Promise<ServiceProductView> {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép tạo gói dịch vụ mới."
      );
    }

    const catExists = await this.serviceRepo.categoryExists(dto.categoryId);
    if (!catExists) {
      throw new EntityNotFoundException("Danh mục dịch vụ", dto.categoryId);
    }

    const pricing = validateAndNormalizeServicePricing({
      priceVnd: dto.priceVnd,
      originalPriceVnd: dto.originalPriceVnd ?? null,
    });

    const img = dto.imageUrl?.trim() || "/images/service-maintenance.jpg";

    return this.uow.runInTransaction(async () => {
      const created = await this.serviceRepo.create({
        id: generateUuidV7(),
        sku: dto.sku.trim(),
        slug: dto.slug.trim(),
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        shortSummary: dto.shortSummary.trim(),
        description: dto.description.trim(),
        imageUrl: img,
        galleryUrls: [img],
        priceVnd: pricing.priceVnd,
        originalPriceVnd: pricing.originalPriceVnd,
        discountPercent: pricing.discountPercent,
        badge: dto.badge ?? null,
        estimatedDuration: dto.estimatedDuration.trim(),
        warrantyLabel: dto.warrantyLabel.trim(),
        compatibleVehicles: dto.compatibleVehicles ?? ["ALL"],
        compatibleBrandsLabel:
          dto.compatibleBrandsLabel?.trim() || "Đa dòng xe du lịch 4-7 chỗ",
        includedSteps: dto.includedSteps ?? [],
        specifications: [],
        isFeatured: dto.isFeatured ?? false,
        isActive: dto.isActive ?? true,
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.service.created",
        resourceType: "ServiceProduct",
        resourceId: created.id,
        payload: { sku: dto.sku, slug: dto.slug, priceVnd: pricing.priceVnd },
      });

      return created.toJSON();
    });
  }

  async update(
    id: string,
    dto: UpdateServiceDto,
    actor: AuthenticatedUser
  ): Promise<ServiceProductView> {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép chỉnh sửa gói dịch vụ."
      );
    }

    return this.uow.runInTransaction(async () => {
      const existing = await this.serviceRepo.findById(id);
      if (!existing) {
        throw new EntityNotFoundException("Gói dịch vụ", id);
      }

      if (dto.categoryId) {
        const catExists = await this.serviceRepo.categoryExists(dto.categoryId);
        if (!catExists) {
          throw new EntityNotFoundException("Danh mục dịch vụ", dto.categoryId);
        }
      }

      const currentJson = existing.toJSON();
      const nextPrice = dto.priceVnd ?? currentJson.priceVnd;
      const nextOriginalPrice =
        dto.originalPriceVnd !== undefined
          ? dto.originalPriceVnd
          : currentJson.originalPriceVnd;

      const pricing = validateAndNormalizeServicePricing({
        priceVnd: nextPrice,
        originalPriceVnd: nextOriginalPrice,
      });

      const updated = await this.serviceRepo.update(id, {
        ...dto,
        priceVnd: pricing.priceVnd,
        originalPriceVnd: pricing.originalPriceVnd,
        discountPercent: pricing.discountPercent,
      });

      if (!updated) {
        throw new EntityNotFoundException("Gói dịch vụ", id);
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.service.updated",
        resourceType: "ServiceProduct",
        resourceId: id,
        payload: { updatedFields: Object.keys(dto), priceVnd: pricing.priceVnd },
      });

      return updated.toJSON();
    });
  }

  async toggleActive(
    id: string,
    isActive: boolean,
    actor: AuthenticatedUser
  ): Promise<ServiceProductView> {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép bật/tắt dịch vụ."
      );
    }

    return this.uow.runInTransaction(async () => {
      const existing = await this.serviceRepo.findById(id);
      if (!existing) {
        throw new EntityNotFoundException("Gói dịch vụ", id);
      }

      const updated = await this.serviceRepo.setActive(id, isActive);
      if (!updated) {
        throw new EntityNotFoundException("Gói dịch vụ", id);
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: isActive
          ? "admin.service.activated"
          : "admin.service.deactivated",
        resourceType: "ServiceProduct",
        resourceId: id,
        payload: { sku: existing.toJSON().sku, isActive },
      });

      return updated.toJSON();
    });
  }
}

