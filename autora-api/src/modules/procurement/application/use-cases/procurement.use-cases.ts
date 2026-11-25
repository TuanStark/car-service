import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import type { PaginatedResult } from "@core/domain/repository.interface";
import {
  BusinessRuleViolationException,
  EntityConflictException,
  EntityNotFoundException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { BasePrismaRepository } from "@infra/prisma/base.prisma-repository";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import {
  assertValidPoStatusTransition,
  calculateWeightedAverageCost,
  type PurchaseOrderStatusValue,
} from "@modules/inventory/domain/inventory.rule";
import type {
  CreatePoDto,
  CreateSupplierDto,
  PoQueryDto,
  ReceivePoDto,
  SupplierQueryDto,
  UpdateSupplierDto,
} from "../dto/procurement.dto";

export interface SupplierDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly phone: string | null;
  readonly email: string | null;
  readonly address: string | null;
  readonly taxCode: string | null;
  readonly paymentTermsDays: number;
  readonly isActive: boolean;
}

export interface PurchaseOrderDto {
  readonly id: string;
  readonly poCode: string;
  readonly supplierId: string;
  readonly supplierName: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly status: PurchaseOrderStatusValue;
  readonly totalCostVnd: number;
  readonly paidAmountVnd: number;
  readonly expectedDate: string | null;
  readonly receivedAt: string | null;
  readonly notes: string | null;
  readonly createdByEmail: string | null;
  readonly createdAt: string;
  readonly items: readonly {
    readonly id: string;
    readonly partItemId: string;
    readonly sku: string;
    readonly partName: string;
    readonly unit: string;
    readonly orderedQty: number;
    readonly receivedQty: number;
    readonly unitCostVnd: number;
    readonly lineTotalVnd: number;
  }[];
}

function assertAdmin(actor: AuthenticatedUser): void {
  if (!actor.roles.includes("admin")) {
    throw new ForbiddenDomainException(
      "Chỉ quản trị viên mới được phép thao tác nhập hàng & nhà cung cấp."
    );
  }
}

@Injectable()
export class ProcurementUseCases extends BasePrismaRepository {
  constructor(
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {
    super();
  }

  async listSuppliers(
    query: SupplierQueryDto
  ): Promise<PaginatedResult<SupplierDto>> {
    const client = this.uow.getClient();
    const where: Prisma.SupplierWhereInput = { deletedAt: null };
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { code: { contains: s, mode: "insensitive" } },
        { name: { contains: s, mode: "insensitive" } },
        { phone: { contains: s, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const [totalItems, rows] = await Promise.all([
      client.supplier.count({ where }),
      client.supplier.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: query.limit,
      }),
    ]);

    return this.toPaginatedResult(
      rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        phone: r.phone,
        email: r.email,
        address: r.address,
        taxCode: r.taxCode,
        paymentTermsDays: r.paymentTermsDays,
        isActive: r.isActive,
      })),
      { page: query.page, limit: query.limit },
      totalItems
    );
  }

  async createSupplier(
    dto: CreateSupplierDto,
    actor: AuthenticatedUser
  ): Promise<SupplierDto> {
    assertAdmin(actor);
    const client = this.uow.getClient();
    const code = dto.code.trim().toUpperCase();
    const dup = await client.supplier.findUnique({ where: { code } });
    if (dup) {
      throw new EntityConflictException(`Mã nhà cung cấp "${code}" đã tồn tại.`);
    }

    return this.uow.runInTransaction(async () => {
      const tx = this.uow.getClient();
      const created = await tx.supplier.create({
        data: {
          id: generateUuidV7(),
          code,
          name: dto.name.trim(),
          phone: dto.phone?.trim() || null,
          email: dto.email?.trim() || null,
          address: dto.address?.trim() || null,
          taxCode: dto.taxCode?.trim() || null,
          paymentTermsDays: dto.paymentTermsDays ?? 15,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.supplier.created",
        resourceType: "Supplier",
        resourceId: created.id,
        payload: { code, name: created.name },
      });

      return {
        id: created.id,
        code: created.code,
        name: created.name,
        phone: created.phone,
        email: created.email,
        address: created.address,
        taxCode: created.taxCode,
        paymentTermsDays: created.paymentTermsDays,
        isActive: created.isActive,
      };
    });
  }

  async updateSupplier(
    id: string,
    dto: UpdateSupplierDto,
    actor: AuthenticatedUser
  ): Promise<SupplierDto> {
    assertAdmin(actor);

    return this.uow.runInTransaction(async () => {
      const tx = this.uow.getClient();
      const existing = await tx.supplier.findFirst({
        where: { id, deletedAt: null },
      });
      if (!existing) throw new EntityNotFoundException("Nhà cung cấp", id);

      const updated = await tx.supplier.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
          ...(dto.email !== undefined ? { email: dto.email.trim() || null } : {}),
          ...(dto.address !== undefined ? { address: dto.address.trim() || null } : {}),
          ...(dto.taxCode !== undefined ? { taxCode: dto.taxCode.trim() || null } : {}),
          ...(dto.paymentTermsDays !== undefined ? { paymentTermsDays: dto.paymentTermsDays } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.supplier.updated",
        resourceType: "Supplier",
        resourceId: id,
        payload: { updatedFields: Object.keys(dto) },
      });

      return {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        taxCode: updated.taxCode,
        paymentTermsDays: updated.paymentTermsDays,
        isActive: updated.isActive,
      };
    });
  }

  async listPurchaseOrders(
    query: PoQueryDto
  ): Promise<PaginatedResult<PurchaseOrderDto>> {
    const client = this.uow.getClient();
    const where: Prisma.PurchaseOrderWhereInput = {
      ...(query.garageId ? { garageId: query.garageId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { poCode: { contains: query.search.trim(), mode: "insensitive" } },
              {
                supplier: {
                  name: { contains: query.search.trim(), mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.limit;
    const [totalItems, rows] = await Promise.all([
      client.purchaseOrder.count({ where }),
      client.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          garage: { select: { id: true, name: true } },
          items: { include: { partItem: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
    ]);

    return this.toPaginatedResult(
      rows.map((r) => this.mapPo(r)),
      { page: query.page, limit: query.limit },
      totalItems
    );
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrderDto> {
    const row = await this.uow.getClient().purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
        garage: { select: { id: true, name: true } },
        items: { include: { partItem: true } },
      },
    });
    if (!row) throw new EntityNotFoundException("Phiếu nhập kho", id);
    return this.mapPo(row);
  }

  async createPurchaseOrder(
    dto: CreatePoDto,
    actor: AuthenticatedUser
  ): Promise<PurchaseOrderDto> {
    assertAdmin(actor);

    const createdId = await this.uow.runInTransaction(async () => {
      const tx = this.uow.getClient();
      const [supplier, garage] = await Promise.all([
        tx.supplier.findFirst({ where: { id: dto.supplierId, deletedAt: null } }),
        tx.garage.findFirst({ where: { id: dto.garageId, deletedAt: null } }),
      ]);
      if (!supplier) throw new EntityNotFoundException("Nhà cung cấp", dto.supplierId);
      if (!garage) throw new EntityNotFoundException("Garage", dto.garageId);

      const partIds = dto.items.map((i) => i.partItemId);
      const parts = await tx.partItem.findMany({
        where: { id: { in: partIds }, deletedAt: null },
      });

      let totalCostVnd = 0;
      const poItems = dto.items.map((reqItem) => {
        const part = parts.find((p) => p.id === reqItem.partItemId);
        if (!part) throw new EntityNotFoundException("Phụ tùng", reqItem.partItemId);
        const lineTotalVnd = Math.round(reqItem.orderedQty * reqItem.unitCostVnd);
        totalCostVnd += lineTotalVnd;
        return {
          id: generateUuidV7(),
          partItemId: part.id,
          orderedQty: reqItem.orderedQty,
          receivedQty: 0,
          unitCostVnd: reqItem.unitCostVnd,
          lineTotalVnd,
        };
      });

      const poId = generateUuidV7();
      const poCode = `PO-${String(Date.now()).slice(-6)}`;
      const status: PurchaseOrderStatusValue =
        dto.submitImmediately === false ? "DRAFT" : "ORDERED";

      await tx.purchaseOrder.create({
        data: {
          id: poId,
          poCode,
          supplierId: dto.supplierId,
          garageId: dto.garageId,
          status,
          totalCostVnd,
          expectedDate: dto.expectedDate
            ? new Date(`${dto.expectedDate}T00:00:00.000Z`)
            : null,
          notes: dto.notes?.trim() || null,
          createdByEmail: actor.email,
          items: { create: poItems },
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.po.created",
        resourceType: "PurchaseOrder",
        resourceId: poId,
        payload: { poCode, supplierId: dto.supplierId, totalCostVnd },
      });

      return poId;
    });

    return this.getPurchaseOrderById(createdId);
  }

  async updatePoStatus(
    id: string,
    status: PurchaseOrderStatusValue,
    actor: AuthenticatedUser
  ): Promise<PurchaseOrderDto> {
    assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const tx = this.uow.getClient();
      const po = await tx.purchaseOrder.findUnique({ where: { id } });
      if (!po) throw new EntityNotFoundException("Phiếu nhập kho", id);

      assertValidPoStatusTransition({
        from: po.status as PurchaseOrderStatusValue,
        to: status,
      });

      await tx.purchaseOrder.update({ where: { id }, data: { status } });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.po.status_updated",
        resourceType: "PurchaseOrder",
        resourceId: id,
        payload: { poCode: po.poCode, from: po.status, to: status },
      });
    });

    return this.getPurchaseOrderById(id);
  }

  async receivePurchaseOrder(
    id: string,
    dto: ReceivePoDto,
    actor: AuthenticatedUser
  ): Promise<PurchaseOrderDto> {
    assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const tx = this.uow.getClient();
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: { include: { partItem: true } } },
      });
      if (!po) throw new EntityNotFoundException("Phiếu nhập kho", id);

      if (po.status !== "ORDERED" && po.status !== "PARTIALLY_RECEIVED") {
        throw new BusinessRuleViolationException(
          "Chỉ có thể nhập kho phiếu đang ở trạng thái Đã đặt hàng hoặc Đang giao một phần.",
          "PO_NOT_RECEIVABLE"
        );
      }

      for (const reqItem of dto.items) {
        const poItem = po.items.find(
          (i) => i.id === reqItem.purchaseOrderItemId
        );
        if (!poItem) {
          throw new EntityNotFoundException(
            "Dòng sản phẩm trong PO",
            reqItem.purchaseOrderItemId
          );
        }

        const remaining =
          Number(poItem.orderedQty) - Number(poItem.receivedQty);
        if (reqItem.receiveQty > remaining) {
          throw new BusinessRuleViolationException(
            `Số lượng nhận (${reqItem.receiveQty}) vượt quá số lượng còn lại (${remaining}) của "${poItem.partItem.name}".`,
            "PO_RECEIVE_EXCEEDS_ORDERED"
          );
        }

        const totalSystemStockAgg = await tx.garageInventory.aggregate({
          where: { partItemId: poItem.partItemId },
          _sum: { onHandQty: true },
        });
        const totalCurrentQty = Number(totalSystemStockAgg._sum.onHandQty ?? 0);

        const nextAvgCost = calculateWeightedAverageCost({
          currentQty: totalCurrentQty,
          currentAvgCostVnd: poItem.partItem.avgCostVnd,
          incomingQty: reqItem.receiveQty,
          incomingUnitCostVnd: poItem.unitCostVnd,
        });

        await tx.partItem.update({
          where: { id: poItem.partItemId },
          data: { avgCostVnd: nextAvgCost },
        });

        const inv = await tx.garageInventory.findUnique({
          where: {
            garageId_partItemId: {
              garageId: po.garageId,
              partItemId: poItem.partItemId,
            },
          },
        });
        const currentGarageQty = inv ? Number(inv.onHandQty) : 0;

        await tx.garageInventory.upsert({
          where: {
            garageId_partItemId: {
              garageId: po.garageId,
              partItemId: poItem.partItemId,
            },
          },
          update: { onHandQty: currentGarageQty + reqItem.receiveQty },
          create: {
            id: generateUuidV7(),
            garageId: po.garageId,
            partItemId: poItem.partItemId,
            onHandQty: reqItem.receiveQty,
            reservedQty: 0,
          },
        });

        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: {
            receivedQty: Number(poItem.receivedQty) + reqItem.receiveQty,
          },
        });

        await tx.stockMovement.create({
          data: {
            id: generateUuidV7(),
            garageId: po.garageId,
            partItemId: poItem.partItemId,
            type: "IN_PO",
            qtyDelta: reqItem.receiveQty,
            unitCostVnd: poItem.unitCostVnd,
            referenceType: "PurchaseOrder",
            referenceId: po.poCode,
            reason: dto.notes?.trim() || `Nhập kho theo phiếu ${po.poCode}`,
            createdByEmail: actor.email,
          },
        });
      }

      const refreshedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
      });
      const allReceived = refreshedItems.every(
        (item) => Number(item.receivedQty) >= Number(item.orderedQty)
      );

      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: allReceived ? "RECEIVED" : "PARTIALLY_RECEIVED",
          receivedAt: allReceived ? new Date() : po.receivedAt,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.po.received",
        resourceType: "PurchaseOrder",
        resourceId: id,
        payload: { poCode: po.poCode, allReceived },
      });
    });

    return this.getPurchaseOrderById(id);
  }

  private mapPo(row: {
    id: string;
    poCode: string;
    supplierId: string;
    supplier: { name: string };
    garageId: string;
    garage: { name: string };
    status: string;
    totalCostVnd: number;
    paidAmountVnd: number;
    expectedDate: Date | null;
    receivedAt: Date | null;
    notes: string | null;
    createdByEmail: string | null;
    createdAt: Date;
    items: readonly {
      id: string;
      partItemId: string;
      orderedQty: Prisma.Decimal;
      receivedQty: Prisma.Decimal;
      unitCostVnd: number;
      lineTotalVnd: number;
      partItem: { sku: string; name: string; unit: string };
    }[];
  }): PurchaseOrderDto {
    return {
      id: row.id,
      poCode: row.poCode,
      supplierId: row.supplierId,
      supplierName: row.supplier.name,
      garageId: row.garageId,
      garageName: row.garage.name,
      status: row.status as PurchaseOrderStatusValue,
      totalCostVnd: row.totalCostVnd,
      paidAmountVnd: row.paidAmountVnd,
      expectedDate: row.expectedDate?.toISOString().slice(0, 10) ?? null,
      receivedAt: row.receivedAt?.toISOString() ?? null,
      notes: row.notes,
      createdByEmail: row.createdByEmail,
      createdAt: row.createdAt.toISOString(),
      items: row.items.map((item) => ({
        id: item.id,
        partItemId: item.partItemId,
        sku: item.partItem.sku,
        partName: item.partItem.name,
        unit: item.partItem.unit,
        orderedQty: Number(item.orderedQty),
        receivedQty: Number(item.receivedQty),
        unitCostVnd: item.unitCostVnd,
        lineTotalVnd: item.lineTotalVnd,
      })),
    };
  }
}

