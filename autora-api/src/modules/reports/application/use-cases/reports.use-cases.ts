import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import type { PaginatedResult } from "@core/domain/repository.interface";
import {
  EntityNotFoundException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import { calculateWorkshopPnl, type PnlOutput } from "../../domain/pnl.rule";
import type {
  CreateExpenseDto,
  ExpenseQueryDto,
  PnlQueryDto,
} from "../dto/reports.dto";

export interface GaragePnlRow extends PnlOutput {
  readonly garageId: string;
  readonly garageName: string;
  readonly paidBookingCount: number;
}

export interface WorkshopPnlReportDto {
  readonly summary: PnlOutput;
  readonly byGarage: readonly GaragePnlRow[];
  readonly cashbook: {
    readonly totalCashInVnd: number;
    readonly totalCashOutVnd: number;
    readonly netCashFlowVnd: number;
  };
}

export interface ExpenseEntryDto {
  readonly id: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly category: string;
  readonly amountVnd: number;
  readonly occurredAt: string;
  readonly referenceCode: string | null;
  readonly description: string;
  readonly receiptUrl: string | null;
  readonly recordedByEmail: string | null;
  readonly createdAt: string;
}

@Injectable()
export class ReportsUseCases {
  constructor(
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  private assertAdmin(actor: AuthenticatedUser) {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép truy cập báo cáo tài chính và sổ quỹ."
      );
    }
  }

  async getWorkshopPnl(query: PnlQueryDto): Promise<WorkshopPnlReportDto> {
    const db = this.uow.getClient();
    const dateFilter =
      query.dateFrom || query.dateTo
        ? {
            ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
            ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
          }
        : undefined;

    const garages = await db.garage.findMany({
      where: {
        deletedAt: null,
        ...(query.garageId ? { id: query.garageId } : {}),
      },
      select: { id: true, name: true, commissionRateBps: true },
      orderBy: { name: "asc" },
    });

    const [
      paidBookings,
      partUsages,
      warrantyClaims,
      expenses,
      paymentLogs,
    ] = await Promise.all([
      db.booking.findMany({
        where: {
          deletedAt: null,
          paymentStatus: "PAID",
          status: { not: "CANCELLED" },
          ...(query.garageId ? { garageId: query.garageId } : {}),
          ...(dateFilter ? { appointmentDate: dateFilter } : {}),
        },
        select: {
          garageId: true,
          totalVnd: true,
          assignedTechnician: {
            select: {
              technicianProfile: { select: { laborCommissionPct: true } },
            },
          },
        },
      }),
      db.bookingPartUsage.findMany({
        where: {
          ...(query.garageId ? { garageId: query.garageId } : {}),
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { garageId: true, lineCostVnd: true },
      }),
      db.warrantyClaim.findMany({
        where: {
          ...(query.garageId ? { warrantyRecord: { garageId: query.garageId } } : {}),
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        select: {
          internalCostVnd: true,
          warrantyRecord: { select: { garageId: true } },
        },
      }),
      db.expenseEntry.findMany({
        where: {
          ...(query.garageId ? { garageId: query.garageId } : {}),
          ...(dateFilter ? { occurredAt: dateFilter } : {}),
        },
        select: { garageId: true, amountVnd: true },
      }),
      db.bookingPaymentLog.findMany({
        where: {
          ...(query.garageId ? { booking: { garageId: query.garageId } } : {}),
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { action: true, amountVnd: true },
      }),
    ]);

    const byGarage: GaragePnlRow[] = garages.map((g) => {
      const gPaid = paidBookings.filter((b) => b.garageId === g.id);
      const paidRevenueVnd = gPaid.reduce((s, b) => s + b.totalVnd, 0);
      const technicianCommissionVnd = gPaid.reduce((s, b) => {
        const pct = b.assignedTechnician?.technicianProfile
          ? Number(b.assignedTechnician.technicianProfile.laborCommissionPct)
          : 0;
        return s + Math.round((b.totalVnd * pct) / 100);
      }, 0);

      const cogsVnd = partUsages
        .filter((u) => u.garageId === g.id)
        .reduce((s, u) => s + u.lineCostVnd, 0);

      const warrantyInternalCostVnd = warrantyClaims
        .filter((c) => c.warrantyRecord.garageId === g.id)
        .reduce((s, c) => s + c.internalCostVnd, 0);

      const operatingExpensesVnd = expenses
        .filter((e) => e.garageId === g.id)
        .reduce((s, e) => s + e.amountVnd, 0);

      const pnl = calculateWorkshopPnl({
        paidRevenueVnd,
        cogsVnd,
        technicianCommissionVnd,
        warrantyInternalCostVnd,
        platformFeeBps: g.commissionRateBps,
        operatingExpensesVnd,
      });

      return {
        garageId: g.id,
        garageName: g.name,
        paidBookingCount: gPaid.length,
        ...pnl,
      };
    });

    const totalPaid = byGarage.reduce((s, r) => s + r.paidRevenueVnd, 0);
    const totalCogs = byGarage.reduce((s, r) => s + r.cogsVnd, 0);
    const totalTech = byGarage.reduce((s, r) => s + r.technicianCommissionVnd, 0);
    const totalWarranty = byGarage.reduce((s, r) => s + r.warrantyInternalCostVnd, 0);
    const totalPlatform = byGarage.reduce((s, r) => s + r.platformFeeVnd, 0);
    const totalOps = byGarage.reduce((s, r) => s + r.operatingExpensesVnd, 0);

    const grossProfitVnd = totalPaid - totalCogs - totalTech - totalWarranty;
    const netProfitVnd = grossProfitVnd - totalPlatform - totalOps;

    const totalCashInVnd =
      paymentLogs
        .filter((l) => l.action === "CAPTURE")
        .reduce((s, l) => s + l.amountVnd, 0) || totalPaid;
    const totalRefunds = paymentLogs
      .filter((l) => l.action === "REFUND")
      .reduce((s, l) => s + l.amountVnd, 0);
    const totalCashOutVnd = totalOps + totalRefunds;

    return {
      summary: {
        paidRevenueVnd: totalPaid,
        cogsVnd: totalCogs,
        technicianCommissionVnd: totalTech,
        warrantyInternalCostVnd: totalWarranty,
        grossProfitVnd,
        platformFeeVnd: totalPlatform,
        operatingExpensesVnd: totalOps,
        netProfitVnd,
        grossMarginPct:
          totalPaid > 0
            ? Number(((grossProfitVnd / totalPaid) * 100).toFixed(1))
            : 0,
      },
      byGarage,
      cashbook: {
        totalCashInVnd,
        totalCashOutVnd,
        netCashFlowVnd: totalCashInVnd - totalCashOutVnd,
      },
    };
  }

  async listExpenses(
    query: ExpenseQueryDto
  ): Promise<PaginatedResult<ExpenseEntryDto>> {
    const db = this.uow.getClient();
    const where: Prisma.ExpenseEntryWhereInput = {
      ...(query.garageId ? { garageId: query.garageId } : {}),
      ...(query.category ? { category: query.category } : {}),
    };

    const [rows, totalItems] = await Promise.all([
      db.expenseEntry.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        include: { garage: { select: { name: true } } },
      }),
      db.expenseEntry.count({ where }),
    ]);

    const items: ExpenseEntryDto[] = rows.map((e) => ({
      id: e.id,
      garageId: e.garageId,
      garageName: e.garage.name,
      category: e.category,
      amountVnd: e.amountVnd,
      occurredAt: e.occurredAt.toISOString().slice(0, 10),
      referenceCode: e.referenceCode,
      description: e.description,
      receiptUrl: e.receiptUrl,
      recordedByEmail: e.recordedByEmail,
      createdAt: e.createdAt.toISOString(),
    }));

    const totalPages = Math.max(1, Math.ceil(totalItems / query.limit));
    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPrevPage: query.page > 1,
      },
    };
  }

  async createExpense(
    dto: CreateExpenseDto,
    actor: AuthenticatedUser
  ): Promise<ExpenseEntryDto> {
    this.assertAdmin(actor);
    const id = generateUuidV7();

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      await client.expenseEntry.create({
        data: {
          id,
          garageId: dto.garageId,
          category: dto.category,
          amountVnd: dto.amountVnd,
          occurredAt: new Date(dto.occurredAt),
          referenceCode: dto.referenceCode ?? null,
          description: dto.description,
          receiptUrl: dto.receiptUrl ?? null,
          recordedByEmail: actor.email,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.expense.created",
        resourceType: "ExpenseEntry",
        resourceId: id,
        payload: {
          category: dto.category,
          amountVnd: dto.amountVnd,
          description: dto.description,
        },
      });
    });

    const list = await this.listExpenses({ page: 1, limit: 25 });
    return list.items.find((e) => e.id === id)!;
  }

  async deleteExpense(id: string, actor: AuthenticatedUser): Promise<void> {
    this.assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.expenseEntry.findUnique({ where: { id } });
      if (!existing) {
        throw new EntityNotFoundException("Phiếu chi", id);
      }

      await client.expenseEntry.delete({ where: { id } });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.expense.deleted",
        resourceType: "ExpenseEntry",
        resourceId: id,
        payload: { amountVnd: existing.amountVnd, description: existing.description },
      });
    });
  }
}

