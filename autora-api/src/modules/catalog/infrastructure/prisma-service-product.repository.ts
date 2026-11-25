import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { PaginatedResult } from "@core/domain/repository.interface";
import { normalizeVietnamese } from "@core/utils/vietnamese.util";
import { BasePrismaRepository } from "@infra/prisma/base.prisma-repository";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import {
  ServiceProductEntity,
  type ServiceSpecification,
} from "../domain/entities/service-product.entity";
import type {
  CatalogFilterCriteria,
  IServiceProductRepository,
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
    });
  }

  private buildWhereClause(
    criteria: CatalogFilterCriteria
  ): Prisma.ServiceProductWhereInput {
    const where: Prisma.ServiceProductWhereInput = {};

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
    const record = await this.uow.getClient().serviceProduct.findUnique({
      where: { slug },
      include: { category: true },
    });
    return record ? this.toDomain(record) : null;
  }
}
