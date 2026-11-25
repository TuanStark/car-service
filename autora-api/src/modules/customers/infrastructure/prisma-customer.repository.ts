import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { PaginatedResult } from "@core/domain/repository.interface";
import { BasePrismaRepository } from "@infra/prisma/base.prisma-repository";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import type {
  CustomerListFilterCriteria,
  CustomerListItemDto,
  CustomerProfileDto,
  CustomerStatusValue,
  ICustomerRepository,
} from "../domain/repositories/customer.repository.interface";

@Injectable()
export class PrismaCustomerRepository
  extends BasePrismaRepository
  implements ICustomerRepository
{
  constructor(private readonly uow: PrismaUnitOfWorkService) {
    super();
  }

  private buildWhereClause(
    criteria: CustomerListFilterCriteria
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {
      userRoles: {
        some: {
          role: { code: "customer" },
        },
      },
    };

    if (criteria.status) {
      where.status = criteria.status;
    }

    if (criteria.search?.trim()) {
      const q = criteria.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    return where;
  }

  async findManyAdmin(
    criteria: CustomerListFilterCriteria
  ): Promise<PaginatedResult<CustomerListItemDto>> {
    const client = this.uow.getClient();
    const where = this.buildWhereClause(criteria);
    const skip = (criteria.page - 1) * criteria.limit;

    const [totalItems, rows] = await Promise.all([
      client.user.count({ where }),
      client.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: criteria.limit,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: { vehicles: true, bookings: true },
          },
        },
      }),
    ]);

    const items: CustomerListItemDto[] = rows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      status: row.status as CustomerStatusValue,
      lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      vehicleCount: row._count.vehicles,
      bookingCount: row._count.bookings,
    }));

    return this.toPaginatedResult(
      items,
      { page: criteria.page, limit: criteria.limit },
      totalItems
    );
  }

  async findProfileById(id: string): Promise<CustomerProfileDto | null> {
    const client = this.uow.getClient();
    const row = await client.user.findFirst({
      where: {
        id,
        userRoles: { some: { role: { code: "customer" } } },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: { vehicles: true, bookings: true },
        },
        vehicles: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            bodyType: true,
            licensePlate: true,
            currentOdoKm: true,
            isPrimary: true,
          },
        },
        bookings: {
          orderBy: { createdAt: "desc" },
          take: 25,
          select: {
            id: true,
            orderCode: true,
            appointmentDate: true,
            appointmentTime: true,
            vehicleLabel: true,
            status: true,
            paymentStatus: true,
            totalVnd: true,
            garage: { select: { name: true } },
          },
        },
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      status: row.status as CustomerStatusValue,
      lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      vehicleCount: row._count.vehicles,
      bookingCount: row._count.bookings,
      vehicles: row.vehicles,
      bookings: row.bookings.map((b) => ({
        id: b.id,
        orderCode: b.orderCode,
        appointmentDate: b.appointmentDate.toISOString().slice(0, 10),
        appointmentTime: b.appointmentTime,
        garageName: b.garage.name,
        vehicleLabel: b.vehicleLabel,
        status: b.status,
        paymentStatus: b.paymentStatus,
        totalVnd: b.totalVnd,
      })),
    };
  }
}
