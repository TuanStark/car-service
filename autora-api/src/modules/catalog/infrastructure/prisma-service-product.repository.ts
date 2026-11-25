import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { PaginatedResult } from "@core/domain/repository.interface";
import { EntityConflictException } from "@core/exceptions/domain.exception";
import { normalizeVietnamese } from "@core/utils/vietnamese.util";
import { BasePrismaRepository } from "@infra/prisma/base.prisma-repository";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import {
  ServiceProductEntity,
  type ServiceSpecification,
} from "../domain/entities/service-product.entity";
import type {
  AdminServiceFilterCriteria,
  CatalogFilterCriteria,
  CreateServiceRecordInput,
  IServiceProductRepository,
  ServiceCategoryOptionDto,
  UpdateServiceRecordInput,
} from "../domain/repositories/service-product.repository.interface";

type ProductWithCategory = Prisma.ServiceProductGetPayload<{
  include: { category: true };
}>;

@Injectable()
export class PrismaServiceProductRepository
  extends BasePrismaRepository
  implements IServiceProductRepository
{
  constructor(private readonly uow: PrismaUnitOfWorkService) {
    super();
  }

  private toDomain(record: ProductWithCategory): ServiceProductEntity {
    const specs = Array.isArray(record.specificationsJson)
      ? (record.specificationsJson as unknown as ServiceSpecification[])
      : [];

    return ServiceProductEntity.reconstitute(record.id, {
      sku: record.sku,
      slug: record.slug,
      categoryId: record.categoryId,
      categoryCode: record.category.code,
      categoryLabel: record.category.title,
      name: record.name,
      shortSummary: record.shortSummary,
      description: record.description,
      imageUrl: record.imageUrl,
      galleryUrls: record.galleryUrls,
      priceVnd: record.priceVnd,
      originalPriceVnd: record.originalPriceVnd,
      discountPercent: record.discountPercent,
      badge: record.badge,
      ratingAvg: Number(record.ratingAvg),
      reviewCount: record.reviewCount,
      bookedCount: record.bookedCount,
      estimatedDuration: record.estimatedDuration,
      warrantyLabel: record.warrantyLabel,
      compatibleVehicles: record.compatibleVehicles,
      compatibleBrandsLabel: record.compatibleBrandsLabel,
      includedSteps: record.includedSteps,
      specifications: specs,
      isFeatured: record.isFeatured,
      isActive: record.isActive,
    });
  }

  private buildWhereClause(
    criteria: CatalogFilterCriteria
  ): Prisma.ServiceProductWhereInput {
    const where: Prisma.ServiceProductWhereInput = {
      isActive: true,
    };

    if (criteria.categoryCode && criteria.categoryCode !== "all") {
      where.category = { code: criteria.categoryCode };
    }

    if (criteria.priceRange === "under-500k") {
      where.priceVnd = { lt: 500_000 };
    } else if (criteria.priceRange === "500k-1500k") {
      where.priceVnd = { gte: 500_000, lte: 1_500_000 };
    } else if (criteria.priceRange === "over-1500k") {
      where.priceVnd = { gt: 1_500_000 };
    }

    if (criteria.vehicleType && criteria.vehicleType !== "ALL") {
      where.compatibleVehicles = {
        hasSome: [criteria.vehicleType, "ALL"],
      };
    }

    if (criteria.onlyDiscounted) {
      where.discountPercent = { gt: 0 };
    }

    if (criteria.query?.trim()) {
      const normalized = normalizeVietnamese(criteria.query);
      where.OR = [
        { name: { contains: criteria.query.trim(), mode: "insensitive" } },
        { sku: { contains: criteria.query.trim(), mode: "insensitive" } },
        { shortSummary: { contains: normalized, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private buildOrderBy(
    sortBy: CatalogFilterCriteria["sortBy"]
  ): Prisma.ServiceProductOrderByWithRelationInput[] {
    switch (sortBy) {
      case "price-asc":
        return [{ priceVnd: "asc" }];
      case "price-desc":
        return [{ priceVnd: "desc" }];
      case "rating":
        return [{ ratingAvg: "desc" }, { reviewCount: "desc" }];
      case "discount":
        return [{ discountPercent: "desc" }, { bookedCount: "desc" }];
      case "popular":
      default:
        return [{ isFeatured: "desc" }, { bookedCount: "desc" }];
    }
  }

  async findMany(
    criteria: CatalogFilterCriteria
  ): Promise<PaginatedResult<ServiceProductEntity>> {
    const db = this.uow.getClient();
    const where = this.buildWhereClause(criteria);
    const orderBy = this.buildOrderBy(criteria.sortBy);
    const skip = (criteria.page - 1) * criteria.limit;

    const [rows, total] = await Promise.all([
      db.serviceProduct.findMany({
        where,
        orderBy,
        skip,
        take: criteria.limit,
        include: { category: true },
      }),
      db.serviceProduct.count({ where }),
    ]);

    return this.toPaginatedResult(
      rows.map((r) => this.toDomain(r)),
      { page: criteria.page, limit: criteria.limit },
      total
    );
  }

  async findBySlug(slug: string): Promise<ServiceProductEntity | null> {
    const record = await this.uow.getClient().serviceProduct.findFirst({
      where: { slug, isActive: true },
      include: { category: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findManyAdmin(
    criteria: AdminServiceFilterCriteria
  ): Promise<PaginatedResult<ServiceProductEntity>> {
    const db = this.uow.getClient();
    const where: Prisma.ServiceProductWhereInput = {};

    if (criteria.categoryId) {
      where.categoryId = criteria.categoryId;
    }
    if (typeof criteria.isActive === "boolean") {
      where.isActive = criteria.isActive;
    }
    if (criteria.query?.trim()) {
      const q = criteria.query.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }

    const skip = (criteria.page - 1) * criteria.limit;
    const [rows, total] = await Promise.all([
      db.serviceProduct.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
        skip,
        take: criteria.limit,
        include: { category: true },
      }),
      db.serviceProduct.count({ where }),
    ]);

    return this.toPaginatedResult(
      rows.map((r) => this.toDomain(r)),
      { page: criteria.page, limit: criteria.limit },
      total
    );
  }

  async findById(id: string): Promise<ServiceProductEntity | null> {
    const record = await this.uow.getClient().serviceProduct.findUnique({
      where: { id },
      include: { category: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async listCategories(): Promise<readonly ServiceCategoryOptionDto[]> {
    const rows = await this.uow.getClient().serviceCategory.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, code: true, title: true, shortLabel: true },
    });
    return rows;
  }

  async categoryExists(categoryId: string): Promise<boolean> {
    const found = await this.uow.getClient().serviceCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    return Boolean(found);
  }

  async create(input: CreateServiceRecordInput): Promise<ServiceProductEntity> {
    try {
      const created = await this.uow.getClient().serviceProduct.create({
        data: {
          id: input.id,
          sku: input.sku,
          slug: input.slug,
          categoryId: input.categoryId,
          name: input.name,
          shortSummary: input.shortSummary,
          description: input.description,
          imageUrl: input.imageUrl,
          galleryUrls: [...input.galleryUrls],
          priceVnd: input.priceVnd,
          originalPriceVnd: input.originalPriceVnd,
          discountPercent: input.discountPercent,
          badge: input.badge,
          estimatedDuration: input.estimatedDuration,
          warrantyLabel: input.warrantyLabel,
          compatibleVehicles: [...input.compatibleVehicles],
          compatibleBrandsLabel: input.compatibleBrandsLabel,
          includedSteps: [...input.includedSteps],
          specificationsJson: input.specifications as unknown as Prisma.InputJsonValue,
          isFeatured: input.isFeatured,
          isActive: input.isActive,
        },
        include: { category: true },
      });
      return this.toDomain(created);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new EntityConflictException(
          "Mã SKU hoặc đường dẫn slug của dịch vụ đã tồn tại."
        );
      }
      throw err;
    }
  }

  async update(
    id: string,
    input: UpdateServiceRecordInput
  ): Promise<ServiceProductEntity | null> {
    try {
      const updated = await this.uow.getClient().serviceProduct.update({
        where: { id },
        data: {
          ...(input.sku !== undefined ? { sku: input.sku } : {}),
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          ...(input.categoryId !== undefined
            ? { categoryId: input.categoryId }
            : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.shortSummary !== undefined
            ? { shortSummary: input.shortSummary }
            : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
          ...(input.priceVnd !== undefined ? { priceVnd: input.priceVnd } : {}),
          ...(input.originalPriceVnd !== undefined
            ? { originalPriceVnd: input.originalPriceVnd }
            : {}),
          ...(input.discountPercent !== undefined
            ? { discountPercent: input.discountPercent }
            : {}),
          ...(input.badge !== undefined ? { badge: input.badge } : {}),
          ...(input.estimatedDuration !== undefined
            ? { estimatedDuration: input.estimatedDuration }
            : {}),
          ...(input.warrantyLabel !== undefined
            ? { warrantyLabel: input.warrantyLabel }
            : {}),
          ...(input.compatibleVehicles !== undefined
            ? { compatibleVehicles: [...input.compatibleVehicles] }
            : {}),
          ...(input.compatibleBrandsLabel !== undefined
            ? { compatibleBrandsLabel: input.compatibleBrandsLabel }
            : {}),
          ...(input.includedSteps !== undefined
            ? { includedSteps: [...input.includedSteps] }
            : {}),
          ...(input.specifications !== undefined
            ? {
                specificationsJson:
                  input.specifications as unknown as Prisma.InputJsonValue,
              }
            : {}),
          ...(input.isFeatured !== undefined
            ? { isFeatured: input.isFeatured }
            : {}),
        },
        include: { category: true },
      });
      return this.toDomain(updated);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new EntityConflictException(
          "Mã SKU hoặc đường dẫn slug của dịch vụ đã tồn tại."
        );
      }
      throw err;
    }
  }

  async setActive(
    id: string,
    isActive: boolean
  ): Promise<ServiceProductEntity | null> {
    const updated = await this.uow.getClient().serviceProduct.update({
      where: { id },
      data: { isActive },
      include: { category: true },
    });
    return this.toDomain(updated);
  }
}
