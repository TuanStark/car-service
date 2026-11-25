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
import { assertSufficientStock } from "../../domain/inventory.rule";
import type {
  AdjustInventoryDto,
  CreatePartDto,
  InventoryQueryDto,
  MovementQueryDto,
  PartQueryDto,
  TransferInventoryDto,
  UpdatePartDto,
} from "../dto/inventory.dto";

export interface PartItemDto {
  readonly id: string;
  readonly sku: string;
  readonly oemCode: string | null;
  readonly name: string;
  readonly category: string;
  readonly unit: string;
  readonly minStockQty: number;
  readonly avgCostVnd: number;
  readonly sellPriceVnd: number;
  readonly imageUrl: string | null;
  readonly isActive: boolean;
}

export interface GarageInventoryItemDto {
  readonly id: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly partItemId: string;
  readonly sku: string;
  readonly oemCode: string | null;
  readonly partName: string;
  readonly category: string;
  readonly unit: string;
  readonly onHandQty: number;
  readonly reservedQty: number;
  readonly minStockQty: number;
  readonly avgCostVnd: number;
  readonly sellPriceVnd: number;
  readonly binLocation: string | null;
  readonly isLowStock: boolean;
  readonly updatedAt: string;
}

export interface StockMovementItemDto {
  readonly id: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly partItemId: string;
  readonly sku: string;
  readonly partName: string;
  readonly unit: string;
  readonly type: string;
  readonly qtyDelta: number;
  readonly unitCostVnd: number;
  readonly referenceType: string | null;
  readonly referenceId: string | null;
  readonly reason: string | null;
  readonly createdByEmail: string | null;
  readonly createdAt: string;
}

function assertAdmin(actor: AuthenticatedUser): void {
  if (!actor.roles.includes("admin")) {
    throw new ForbiddenDomainException(
      "Chỉ quản trị viên mới được phép thao tác kho phụ tùng."
    );
  }
}

@Injectable()
export class InventoryUseCases extends BasePrismaRepository {
  constructor(
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {
    super();
  }

  async listParts(query: PartQueryDto): Promise<PaginatedResult<PartItemDto>> {
    const client = this.uow.getClient();
    const where: Prisma.PartItemWhereInput = { deletedAt: null };
    if (query.category) where.category = query.category;
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { sku: { contains: s, mode: "insensitive" } },
        { oemCode: { contains: s, mode: "insensitive" } },
        { name: { contains: s, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const [totalItems, rows] = await Promise.all([
      client.partItem.count({ where }),
      client.partItem.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: query.limit,
      }),
    ]);

    return this.toPaginatedResult(
      rows.map((r) => ({
        id: r.id,
        sku: r.sku,
        oemCode: r.oemCode,
        name: r.name,
        category: r.category,
        unit: r.unit,
        minStockQty: Number(r.minStockQty),
        avgCostVnd: r.avgCostVnd,
        sellPriceVnd: r.sellPriceVnd,
        imageUrl: r.imageUrl,
        isActive: r.isActive,
      })),
      { page: query.page, limit: query.limit },
      totalItems
    );
  }

  async createPart(
    dto: CreatePartDto,
    actor: AuthenticatedUser
  ): Promise<PartItemDto> {
    assertAdmin(actor);
    const client = this.uow.getClient();
    const sku = dto.sku.trim().toUpperCase();
    const dup = await client.partItem.findUnique({ where: { sku } });
    if (dup) {
      throw new EntityConflictException(`Mã phụ tùng "${sku}" đã tồn tại.`);
    }

    return this.uow.runInTransaction(async () => {
      const tx = this.uow.getClient();
      const created = await tx.partItem.create({
        data: {
          id: generateUuidV7(),
          sku,
          oemCode: dto.oemCode?.trim() || null,
          name: dto.name.trim(),
          category: dto.category,
          unit: dto.unit.trim(),
          minStockQty: dto.minStockQty ?? 5,
          avgCostVnd: dto.avgCostVnd ?? 0,
          sellPriceVnd: dto.sellPriceVnd,
          imageUrl: dto.imageUrl?.trim() || null,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.part.created",
        resourceType: "PartItem",
        resourceId: created.id,
        payload: { sku, name: created.name, sellPriceVnd: created.sellPriceVnd },
      });

      return {
        id: created.id,
        sku: created.sku,
        oemCode: created.oemCode,
        name: created.name,
        category: created.category,
        unit: created.unit,
        minStockQty: Number(created.minStockQty),
        avgCostVnd: created.avgCostVnd,
        sellPriceVnd: created.sellPriceVnd,
        imageUrl: created.imageUrl,
        isActive: created.isActive,
      };
    });
  }

  async updatePart(
    id: string,
    dto: UpdatePartDto,
    actor: AuthenticatedUser
  ): Promise<PartItemDto> {
    assertAdmin(actor);

    return this.uow.runInTransaction(async () => {
      const tx = this.uow.getClient();
      const existing = await tx.partItem.findFirst({
        where: { id, deletedAt: null },
      });
      if (!existing) throw new EntityNotFoundException("Phụ tùng", id);

      const updated = await tx.partItem.update({
        where: { id },
        data: {
          ...(dto.oemCode !== undefined ? { oemCode: dto.oemCode.trim() || null } : {}),
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.unit !== undefined ? { unit: dto.unit.trim() } : {}),
          ...(dto.minStockQty !== undefined ? { minStockQty: dto.minStockQty } : {}),
          ...(dto.sellPriceVnd !== undefined ? { sellPriceVnd: dto.sellPriceVnd } : {}),
          ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl.trim() || null } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.part.updated",
        resourceType: "PartItem",
        resourceId: id,
        payload: { updatedFields: Object.keys(dto) },
      });

      return {
        id: updated.id,
        sku: updated.sku,
        oemCode: updated.oemCode,
        name: updated.name,
        category: updated.category,
        unit: updated.unit,
        minStockQty: Number(updated.minStockQty),
        avgCostVnd: updated.avgCostVnd,
        sellPriceVnd: updated.sellPriceVnd,
        imageUrl: updated.imageUrl,
        isActive: updated.isActive,
      };
    });
  }

  async listInventory(
    query: InventoryQueryDto
  ): Promise<PaginatedResult<GarageInventoryItemDto>> {
    const client = this.uow.getClient();
    const where: Prisma.GarageInventoryWhereInput = {
      partItem: {
        deletedAt: null,
        ...(query.category ? { category: query.category } : {}),
        ...(query.search?.trim()
          ? {
              OR: [
                { sku: { contains: query.search.trim(), mode: "insensitive" } },
                { name: { contains: query.search.trim(), mode: "insensitive" } },
                { oemCode: { contains: query.search.trim(), mode: "insensitive" } },
              ],
            }
          : {}),
      },
      ...(query.garageId ? { garageId: query.garageId } : {}),
    };

    const rows = await client.garageInventory.findMany({
      where,
      include: {
        garage: { select: { id: true, name: true } },
        partItem: true,
      },
      orderBy: [{ garage: { name: "asc" } }, { partItem: { name: "asc" } }],
    });

    const mapped = rows
      .map((r) => {
        const onHandQty = Number(r.onHandQty);
        const minStockQty = Number(r.partItem.minStockQty);
        return {
          id: r.id,
          garageId: r.garage.id,
          garageName: r.garage.name,
          partItemId: r.partItem.id,
          sku: r.partItem.sku,
          oemCode: r.partItem.oemCode,
          partName: r.partItem.name,
          category: r.partItem.category,
          unit: r.partItem.unit,
          onHandQty,
          reservedQty: Number(r.reservedQty),
          minStockQty,
          avgCostVnd: r.partItem.avgCostVnd,
          sellPriceVnd: r.partItem.sellPriceVnd,
          binLocation: r.binLocation,
          isLowStock: onHandQty <= minStockQty,
          updatedAt: r.updatedAt.toISOString(),
        };
      })
      .filter((item) => (query.lowStock ? item.isLowStock : true));

    const start = (query.page - 1) * query.limit;
    const paged = mapped.slice(start, start + query.limit);

    return this.toPaginatedResult(
      paged,
      { page: query.page, limit: query.limit },
      mapped.length
    );
  }

  async adjustStock(
    dto: AdjustInventoryDto,
    actor: AuthenticatedUser
  ): Promise<GarageInventoryItemDto> {
    assertAdmin(actor);

    const savedId = await this.uow.runInTransaction(async () => {
      const tx = this.uow.getClient();
      const [garage, part] = await Promise.all([
        tx.garage.findFirst({ where: { id: dto.garageId, deletedAt: null } }),
        tx.partItem.findFirst({ where: { id: dto.partItemId, deletedAt: null } }),
      ]);
      if (!garage) throw new EntityNotFoundException("Garage", dto.garageId);
      if (!part) throw new EntityNotFoundException("Phụ tùng", dto.partItemId);

      const inv = await tx.garageInventory.findUnique({
        where: {
          garageId_partItemId: {
            garageId: dto.garageId,
            partItemId: dto.partItemId,
          },
        },
      });

      const currentQty = inv ? Number(inv.onHandQty) : 0;
      const nextQty = currentQty + dto.qtyDelta;
      if (nextQty < 0) {
        throw new BusinessRuleViolationException(
          `Không thể điều chỉnh âm tồn kho "${part.name}" (hiện có ${currentQty}).`,
          "NEGATIVE_STOCK_NOT_ALLOWED"
        );
      }

      const upserted = await tx.garageInventory.upsert({
        where: {
          garageId_partItemId: {
            garageId: dto.garageId,
            partItemId: dto.partItemId,
          },
        },
        update: {
          onHandQty: nextQty,
          ...(dto.binLocation !== undefined
            ? { binLocation: dto.binLocation.trim() || null }
            : {}),
        },
        create: {
          id: generateUuidV7(),
          garageId: dto.garageId,
          partItemId: dto.partItemId,
          onHandQty: nextQty,
          reservedQty: 0,
          binLocation: dto.binLocation?.trim() || null,
        },
      });

      await tx.stockMovement.create({
        data: {
          id: generateUuidV7(),
          garageId: dto.garageId,
          partItemId: dto.partItemId,
          type: "ADJUSTMENT",
          qtyDelta: dto.qtyDelta,
          unitCostVnd: part.avgCostVnd,
          referenceType: "InventoryCheck",
          referenceId: upserted.id,
          reason: dto.reason.trim(),
          createdByEmail: actor.email,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.inventory.adjusted",
        resourceType: "GarageInventory",
        resourceId: upserted.id,
        payload: {
          sku: part.sku,
          qtyDelta: dto.qtyDelta,
          nextQty,
          reason: dto.reason.trim(),
        },
      });

      return upserted.id;
    });

    const row = await this.uow.getClient().garageInventory.findUniqueOrThrow({
      where: { id: savedId },
      include: { garage: { select: { id: true, name: true } }, partItem: true },
    });

    const onHandQty = Number(row.onHandQty);
    const minStockQty = Number(row.partItem.minStockQty);
    return {
      id: row.id,
      garageId: row.garage.id,
      garageName: row.garage.name,
      partItemId: row.partItem.id,
      sku: row.partItem.sku,
      oemCode: row.partItem.oemCode,
      partName: row.partItem.name,
      category: row.partItem.category,
      unit: row.partItem.unit,
      onHandQty,
      reservedQty: Number(row.reservedQty),
      minStockQty,
      avgCostVnd: row.partItem.avgCostVnd,
      sellPriceVnd: row.partItem.sellPriceVnd,
      binLocation: row.binLocation,
      isLowStock: onHandQty <= minStockQty,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async transferStock(
    dto: TransferInventoryDto,
    actor: AuthenticatedUser
  ): Promise<{ success: true }> {
    assertAdmin(actor);
    if (dto.fromGarageId === dto.toGarageId) {
      throw new BusinessRuleViolationException(
        "Garage xuất và Garage nhận phải khác nhau.",
        "SAME_TRANSFER_GARAGE"
      );
    }

    await this.uow.runInTransaction(async () => {
      const tx = this.uow.getClient();
      const part = await tx.partItem.findFirst({
        where: { id: dto.partItemId, deletedAt: null },
      });
      if (!part) throw new EntityNotFoundException("Phụ tùng", dto.partItemId);

      const sourceInv = await tx.garageInventory.findUnique({
        where: {
          garageId_partItemId: {
            garageId: dto.fromGarageId,
            partItemId: dto.partItemId,
          },
        },
      });
      const available = sourceInv ? Number(sourceInv.onHandQty) : 0;
      assertSufficientStock({
        availableQty: available,
        requestedQty: dto.quantity,
        partName: part.name,
      });

      await tx.garageInventory.update({
        where: { id: sourceInv!.id },
        data: { onHandQty: available - dto.quantity },
      });

      const destInv = await tx.garageInventory.findUnique({
        where: {
          garageId_partItemId: {
            garageId: dto.toGarageId,
            partItemId: dto.partItemId,
          },
        },
      });
      const destQty = destInv ? Number(destInv.onHandQty) : 0;
      await tx.garageInventory.upsert({
        where: {
          garageId_partItemId: {
            garageId: dto.toGarageId,
            partItemId: dto.partItemId,
          },
        },
        update: { onHandQty: destQty + dto.quantity },
        create: {
          id: generateUuidV7(),
          garageId: dto.toGarageId,
          partItemId: dto.partItemId,
          onHandQty: dto.quantity,
          reservedQty: 0,
        },
      });

      const transferRef = generateUuidV7();
      await tx.stockMovement.createMany({
        data: [
          {
            id: generateUuidV7(),
            garageId: dto.fromGarageId,
            partItemId: dto.partItemId,
            type: "TRANSFER_OUT",
            qtyDelta: -dto.quantity,
            unitCostVnd: part.avgCostVnd,
            referenceType: "StockTransfer",
            referenceId: transferRef,
            reason: dto.reason.trim(),
            createdByEmail: actor.email,
          },
          {
            id: generateUuidV7(),
            garageId: dto.toGarageId,
            partItemId: dto.partItemId,
            type: "TRANSFER_IN",
            qtyDelta: dto.quantity,
            unitCostVnd: part.avgCostVnd,
            referenceType: "StockTransfer",
            referenceId: transferRef,
            reason: dto.reason.trim(),
            createdByEmail: actor.email,
          },
        ],
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.inventory.transferred",
        resourceType: "StockTransfer",
        resourceId: transferRef,
        payload: {
          sku: part.sku,
          fromGarageId: dto.fromGarageId,
          toGarageId: dto.toGarageId,
          quantity: dto.quantity,
        },
      });
    });

    return { success: true };
  }

  async listMovements(
    query: MovementQueryDto
  ): Promise<PaginatedResult<StockMovementItemDto>> {
    const client = this.uow.getClient();
    const where: Prisma.StockMovementWhereInput = {
      ...(query.garageId ? { garageId: query.garageId } : {}),
      ...(query.partItemId ? { partItemId: query.partItemId } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const skip = (query.page - 1) * query.limit;
    const [totalItems, rows] = await Promise.all([
      client.stockMovement.count({ where }),
      client.stockMovement.findMany({
        where,
        include: {
          garage: { select: { id: true, name: true } },
          partItem: { select: { id: true, sku: true, name: true, unit: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
    ]);

    return this.toPaginatedResult(
      rows.map((r) => ({
        id: r.id,
        garageId: r.garage.id,
        garageName: r.garage.name,
        partItemId: r.partItem.id,
        sku: r.partItem.sku,
        partName: r.partItem.name,
        unit: r.partItem.unit,
        type: r.type,
        qtyDelta: Number(r.qtyDelta),
        unitCostVnd: r.unitCostVnd,
        referenceType: r.referenceType,
        referenceId: r.referenceId,
        reason: r.reason,
        createdByEmail: r.createdByEmail,
        createdAt: r.createdAt.toISOString(),
      })),
      { page: query.page, limit: query.limit },
      totalItems
    );
  }
}

