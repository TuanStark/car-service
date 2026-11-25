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
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import type {
  CouponQueryDto,
  CreateCouponDto,
  UpdateCouponDto,
} from "../dto/promotion.dto";

export interface CouponDto {
  readonly id: string;
  readonly code: string;
  readonly description: string;
  readonly discountType: string;
  readonly discountValue: number;
  readonly maxDiscountVnd: number | null;
  readonly minOrderVnd: number;
  readonly usageLimit: number | null;
  readonly usedCount: number;
  readonly startsAt: string;
  readonly expiresAt: string;
  readonly isActive: boolean;
}

@Injectable()
export class PromotionsUseCases {
  constructor(
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  private assertAdmin(actor: AuthenticatedUser) {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép quản lý mã khuyến mãi."
      );
    }
  }

  async listCoupons(query: CouponQueryDto): Promise<PaginatedResult<CouponDto>> {
    const db = this.uow.getClient();
    const where: Prisma.CouponWhereInput = {
      deletedAt: null,
      ...(query.search?.trim()
        ? {
            OR: [
              { code: { contains: query.search.trim(), mode: "insensitive" } },
              { description: { contains: query.search.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, totalItems] = await Promise.all([
      db.coupon.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      }),
      db.coupon.count({ where }),
    ]);

    const items: CouponDto[] = rows.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxDiscountVnd: c.maxDiscountVnd,
      minOrderVnd: c.minOrderVnd,
      usageLimit: c.usageLimit,
      usedCount: c.usedCount,
      startsAt: c.startsAt.toISOString(),
      expiresAt: c.expiresAt.toISOString(),
      isActive: c.isActive,
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

  async createCoupon(
    dto: CreateCouponDto,
    actor: AuthenticatedUser
  ): Promise<CouponDto> {
    this.assertAdmin(actor);
    if (dto.discountType === "PERCENTAGE" && dto.discountValue > 100) {
      throw new BusinessRuleViolationException(
        "Phần trăm giảm giá không được vượt quá 100%.",
        "INVALID_DISCOUNT_PERCENT"
      );
    }

    const id = generateUuidV7();
    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const dup = await client.coupon.findUnique({ where: { code: dto.code } });
      if (dup) {
        throw new EntityConflictException(`Mã khuyến mãi "${dto.code}" đã tồn tại.`);
      }

      await client.coupon.create({
        data: {
          id,
          code: dto.code,
          description: dto.description,
          discountType: dto.discountType,
          discountValue: dto.discountValue,
          maxDiscountVnd: dto.maxDiscountVnd ?? null,
          minOrderVnd: dto.minOrderVnd ?? 0,
          usageLimit: dto.usageLimit ?? null,
          startsAt: new Date(dto.startsAt),
          expiresAt: new Date(dto.expiresAt),
          isActive: true,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.coupon.created",
        resourceType: "Coupon",
        resourceId: id,
        payload: { code: dto.code, discountType: dto.discountType, discountValue: dto.discountValue },
      });
    });

    const list = await this.listCoupons({ page: 1, limit: 1, search: dto.code });
    return list.items[0]!;
  }

  async updateCoupon(
    id: string,
    dto: UpdateCouponDto,
    actor: AuthenticatedUser
  ): Promise<CouponDto> {
    this.assertAdmin(actor);

    return this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.coupon.findUnique({ where: { id } });
      if (!existing) {
        throw new EntityNotFoundException("Mã khuyến mãi", id);
      }

      if (dto.code && dto.code !== existing.code && existing.usedCount > 0) {
        throw new BusinessRuleViolationException(
          "Không thể đổi mã khuyến mãi đã có lượt sử dụng.",
          "COUPON_ALREADY_USED"
        );
      }

      const updated = await client.coupon.update({
        where: { id },
        data: {
          ...(dto.code !== undefined ? { code: dto.code } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.discountValue !== undefined ? { discountValue: dto.discountValue } : {}),
          ...(dto.minOrderVnd !== undefined ? { minOrderVnd: dto.minOrderVnd } : {}),
          ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.coupon.updated",
        resourceType: "Coupon",
        resourceId: id,
        payload: { code: updated.code, isActive: updated.isActive },
      });

      return {
        id: updated.id,
        code: updated.code,
        description: updated.description,
        discountType: updated.discountType,
        discountValue: updated.discountValue,
        maxDiscountVnd: updated.maxDiscountVnd,
        minOrderVnd: updated.minOrderVnd,
        usageLimit: updated.usageLimit,
        usedCount: updated.usedCount,
        startsAt: updated.startsAt.toISOString(),
        expiresAt: updated.expiresAt.toISOString(),
        isActive: updated.isActive,
      };
    });
  }
}
