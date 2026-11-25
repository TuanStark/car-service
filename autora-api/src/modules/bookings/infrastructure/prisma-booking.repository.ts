import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { PaginatedResult } from "@core/domain/repository.interface";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { BasePrismaRepository } from "@infra/prisma/base.prisma-repository";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import {
  getAllowedNextBookingStatuses,
  type BookingStatusValue,
} from "../domain/booking-status-machine";
import type {
  BookingDetailDto,
  BookingListFilterCriteria,
  BookingListItemDto,
  IBookingRepository,
  TransitionBookingStatusParams,
} from "../domain/repositories/booking.repository.interface";

@Injectable()
export class PrismaBookingRepository
  extends BasePrismaRepository
  implements IBookingRepository
{
  constructor(private readonly uow: PrismaUnitOfWorkService) {
    super();
  }

  private buildWhereClause(
    criteria: BookingListFilterCriteria
  ): Prisma.BookingWhereInput {
    const where: Prisma.BookingWhereInput = {};

    if (criteria.status) {
      where.status = criteria.status;
    }

    if (criteria.garageId) {
      where.garageId = criteria.garageId;
    }

    if (criteria.dateFrom || criteria.dateTo) {
      where.appointmentDate = {
        ...(criteria.dateFrom
          ? { gte: new Date(`${criteria.dateFrom}T00:00:00.000Z`) }
          : {}),
        ...(criteria.dateTo
          ? { lte: new Date(`${criteria.dateTo}T23:59:59.999Z`) }
          : {}),
      };
    }

    if (criteria.search?.trim()) {
      const q = criteria.search.trim();
      where.OR = [
        { orderCode: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q, mode: "insensitive" } },
        { licensePlate: { contains: q, mode: "insensitive" } },
        { vehicleLabel: { contains: q, mode: "insensitive" } },
        { garage: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    return where;
  }

  private buildOrderBy(
    sortBy: BookingListFilterCriteria["sortBy"],
    sortOrder: BookingListFilterCriteria["sortOrder"]
  ): Prisma.BookingOrderByWithRelationInput[] {
    const direction = sortOrder ?? "desc";
    switch (sortBy) {
      case "appointmentDate":
        return [{ appointmentDate: direction }, { appointmentTime: direction }];
      case "totalVnd":
        return [{ totalVnd: direction }];
      case "createdAt":
      default:
        return [{ createdAt: direction }];
    }
  }

  async findManyAdmin(
    criteria: BookingListFilterCriteria
  ): Promise<PaginatedResult<BookingListItemDto>> {
    const client = this.uow.getClient();
    const where = this.buildWhereClause(criteria);
    const skip = (criteria.page - 1) * criteria.limit;

    const [totalItems, rows] = await Promise.all([
      client.booking.count({ where }),
      client.booking.findMany({
        where,
        orderBy: this.buildOrderBy(criteria.sortBy, criteria.sortOrder),
        skip,
        take: criteria.limit,
        include: {
          garage: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

    const items: BookingListItemDto[] = rows.map((row) => ({
      id: row.id,
      orderCode: row.orderCode,
      appointmentDate: row.appointmentDate.toISOString().slice(0, 10),
      appointmentTime: row.appointmentTime,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      vehicleLabel: row.vehicleLabel,
      licensePlate: row.licensePlate,
      garageId: row.garage.id,
      garageName: row.garage.name,
      status: row.status as BookingStatusValue,
      paymentMethod: row.paymentMethod,
      paymentStatus: row.paymentStatus,
      totalVnd: row.totalVnd,
      version: row.version,
      itemCount: row._count.items,
      createdAt: row.createdAt.toISOString(),
    }));

    return this.toPaginatedResult(
      items,
      { page: criteria.page, limit: criteria.limit },
      totalItems
    );
  }

  async findDetailById(id: string): Promise<BookingDetailDto | null> {
    const client = this.uow.getClient();
    const row = await client.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        garage: { select: { id: true, name: true, fullAddress: true } },
        items: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!row) return null;

    const currentStatus = row.status as BookingStatusValue;

    return {
      id: row.id,
      orderCode: row.orderCode,
      appointmentDate: row.appointmentDate.toISOString().slice(0, 10),
      appointmentTime: row.appointmentTime,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      userId: row.userId,
      userEmail: row.user?.email ?? null,
      garageId: row.garage.id,
      garageName: row.garage.name,
      garageAddress: row.garage.fullAddress,
      vehicleId: row.vehicleId,
      vehicleLabel: row.vehicleLabel,
      licensePlate: row.licensePlate,
      odoKm: row.odoKm,
      paymentMethod: row.paymentMethod,
      paymentStatus: row.paymentStatus,
      status: currentStatus,
      allowedNextStatuses: getAllowedNextBookingStatuses(currentStatus),
      subtotalVnd: row.subtotalVnd,
      discountVnd: row.discountVnd,
      totalVnd: row.totalVnd,
      notes: row.notes,
      version: row.version,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      items: row.items.map((item) => ({
        id: item.id,
        serviceProductId: item.serviceProductId,
        serviceNameSnap: item.serviceNameSnap,
        skuSnap: item.skuSnap,
        unitPriceVnd: item.unitPriceVnd,
        quantity: item.quantity,
        lineTotalVnd: item.lineTotalVnd,
      })),
      statusHistory: row.statusHistory.map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus as BookingStatusValue | null,
        toStatus: h.toStatus as BookingStatusValue,
        reason: h.reason,
        changedByEmail: h.changedByEmail,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }

  async transitionStatusWithVersion(
    params: TransitionBookingStatusParams
  ): Promise<boolean> {
    const client = this.uow.getClient();

    const updated = await client.booking.updateMany({
      where: {
        id: params.id,
        version: params.expectedVersion,
        deletedAt: null,
      },
      data: {
        status: params.toStatus,
        version: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      return false;
    }

    await client.bookingStatusHistory.create({
      data: {
        id: generateUuidV7(),
        bookingId: params.id,
        fromStatus: params.fromStatus,
        toStatus: params.toStatus,
        reason: params.reason ?? null,
        changedByUserId: params.changedByUserId,
        changedByEmail: params.changedByEmail,
      },
    });

    return true;
  }
}
