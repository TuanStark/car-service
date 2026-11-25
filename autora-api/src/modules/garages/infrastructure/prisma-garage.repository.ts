import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { PaginatedResult } from "@core/domain/repository.interface";
import { EntityConflictException } from "@core/exceptions/domain.exception";
import { BasePrismaRepository } from "@infra/prisma/base.prisma-repository";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import type {
  GarageCityCodeValue,
  GarageStatusValue,
} from "../domain/rules/garage.rule";
import type {
  CreateGarageRecordInput,
  GarageDetailDto,
  GarageListFilterCriteria,
  GarageListItemDto,
  IGarageRepository,
  UpdateGarageRecordInput,
} from "../domain/repositories/garage.repository.interface";

@Injectable()
export class PrismaGarageRepository
  extends BasePrismaRepository
  implements IGarageRepository
{
  constructor(private readonly uow: PrismaUnitOfWorkService) {
    super();
  }

  private buildWhereClause(
    criteria: GarageListFilterCriteria
  ): Prisma.GarageWhereInput {
    const where: Prisma.GarageWhereInput = {};

    if (criteria.cityCode) {
      where.cityCode = criteria.cityCode;
    }
    if (criteria.status) {
      where.status = criteria.status;
    }
    if (typeof criteria.verified === "boolean") {
      where.verified = criteria.verified;
    }

    if (criteria.search?.trim()) {
      const q = criteria.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { district: { contains: q, mode: "insensitive" } },
        { fullAddress: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }

    return where;
  }

  async findManyAdmin(
    criteria: GarageListFilterCriteria
  ): Promise<PaginatedResult<GarageListItemDto>> {
    const client = this.uow.getClient();
    const where = this.buildWhereClause(criteria);
    const skip = (criteria.page - 1) * criteria.limit;

    const [totalItems, rows] = await Promise.all([
      client.garage.count({ where }),
      client.garage.findMany({
        where,
        orderBy: [{ verified: "asc" }, { createdAt: "desc" }],
        skip,
        take: criteria.limit,
        include: {
          _count: {
            select: { garageServices: true, bookings: true },
          },
        },
      }),
    ]);

    const items: GarageListItemDto[] = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      district: row.district,
      cityCode: row.cityCode as GarageCityCodeValue,
      cityLabel: row.cityLabel,
      fullAddress: row.fullAddress,
      phone: row.phone,
      ratingAvg: Number(row.ratingAvg),
      reviewCount: row.reviewCount,
      verified: row.verified,
      status: row.status as GarageStatusValue,
      isFeatured: row.isFeatured,
      bayCount: row.bayCount,
      startingPriceVnd: row.startingPriceVnd,
      openHours: row.openHours,
      serviceCount: row._count.garageServices,
      bookingCount: row._count.bookings,
      updatedAt: row.updatedAt.toISOString(),
    }));

    return this.toPaginatedResult(
      items,
      { page: criteria.page, limit: criteria.limit },
      totalItems
    );
  }

  async findDetailById(id: string): Promise<GarageDetailDto | null> {
    const client = this.uow.getClient();
    const row = await client.garage.findUnique({
      where: { id },
      include: {
        _count: { select: { garageServices: true, bookings: true } },
        garageServices: {
          include: {
            serviceProduct: {
              include: { category: { select: { title: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        bookings: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      district: row.district,
      cityCode: row.cityCode as GarageCityCodeValue,
      cityLabel: row.cityLabel,
      fullAddress: row.fullAddress,
      phone: row.phone,
      ratingAvg: Number(row.ratingAvg),
      reviewCount: row.reviewCount,
      verified: row.verified,
      status: row.status as GarageStatusValue,
      isFeatured: row.isFeatured,
      bayCount: row.bayCount,
      startingPriceVnd: row.startingPriceVnd,
      openHours: row.openHours,
      serviceCount: row._count.garageServices,
      bookingCount: row._count.bookings,
      updatedAt: row.updatedAt.toISOString(),
      coverImageUrl: row.coverImageUrl,
      certifications: row.certifications,
      summary: row.summary,
      createdAt: row.createdAt.toISOString(),
      offeredServices: row.garageServices.map((gs) => ({
        serviceProductId: gs.serviceProductId,
        sku: gs.serviceProduct.sku,
        name: gs.serviceProduct.name,
        categoryTitle: gs.serviceProduct.category.title,
        basePriceVnd: gs.serviceProduct.priceVnd,
        customPriceVnd: gs.customPriceVnd,
        isAvailable: gs.isAvailable,
      })),
      recentBookings: row.bookings.map((b) => ({
        id: b.id,
        orderCode: b.orderCode,
        customerName: b.customerName,
        appointmentDate: b.appointmentDate.toISOString().slice(0, 10),
        appointmentTime: b.appointmentTime,
        status: b.status,
        totalVnd: b.totalVnd,
      })),
    };
  }

  async create(input: CreateGarageRecordInput): Promise<GarageDetailDto> {
    const client = this.uow.getClient();
    const duplicate = await client.garage.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (duplicate) {
      throw new EntityConflictException(
        `Slug garage "${input.slug}" đã tồn tại.`
      );
    }

    const created = await client.garage.create({
      data: {
        id: input.id,
        slug: input.slug,
        name: input.name,
        district: input.district,
        cityCode: input.cityCode,
        cityLabel: input.cityLabel,
        fullAddress: input.fullAddress,
        phone: input.phone ?? null,
        verified: input.verified,
        status: input.status,
        isFeatured: input.isFeatured,
        coverImageUrl: input.coverImageUrl,
        openHours: input.openHours,
        bayCount: input.bayCount,
        startingPriceVnd: input.startingPriceVnd,
        certifications: [...input.certifications],
        summary: input.summary,
      },
    });

    const detail = await this.findDetailById(created.id);
    if (!detail) {
      throw new Error("Failed to load created garage");
    }
    return detail;
  }

  async update(
    id: string,
    input: UpdateGarageRecordInput
  ): Promise<GarageDetailDto | null> {
    const client = this.uow.getClient();
    await client.garage.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.district !== undefined
          ? { district: input.district.trim() }
          : {}),
        ...(input.cityCode !== undefined ? { cityCode: input.cityCode } : {}),
        ...(input.cityLabel !== undefined
          ? { cityLabel: input.cityLabel.trim() }
          : {}),
        ...(input.fullAddress !== undefined
          ? { fullAddress: input.fullAddress.trim() }
          : {}),
        ...(input.phone !== undefined
          ? { phone: input.phone?.trim() || null }
          : {}),
        ...(input.isFeatured !== undefined
          ? { isFeatured: input.isFeatured }
          : {}),
        ...(input.coverImageUrl !== undefined
          ? { coverImageUrl: input.coverImageUrl.trim() }
          : {}),
        ...(input.openHours !== undefined
          ? { openHours: input.openHours.trim() }
          : {}),
        ...(input.bayCount !== undefined ? { bayCount: input.bayCount } : {}),
        ...(input.startingPriceVnd !== undefined
          ? { startingPriceVnd: input.startingPriceVnd }
          : {}),
        ...(input.certifications !== undefined
          ? { certifications: [...input.certifications] }
          : {}),
        ...(input.summary !== undefined
          ? { summary: input.summary.trim() }
          : {}),
      },
    });

    return this.findDetailById(id);
  }

  async updateStatus(
    id: string,
    input: { status?: GarageStatusValue; verified?: boolean }
  ): Promise<GarageDetailDto | null> {
    const client = this.uow.getClient();
    await client.garage.update({
      where: { id },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(typeof input.verified === "boolean"
          ? { verified: input.verified }
          : {}),
      },
    });

    return this.findDetailById(id);
  }
}
