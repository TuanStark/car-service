import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import type { PaginatedResult } from "@core/domain/repository.interface";
import {
  EntityNotFoundException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import type { ReplyReviewDto, ReviewQueryDto } from "../dto/review.dto";

export interface AdminReviewDto {
  readonly id: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly garageId: string | null;
  readonly garageName: string | null;
  readonly serviceName: string | null;
  readonly vehicleLabel: string;
  readonly rating: number;
  readonly comment: string;
  readonly adminReply: string | null;
  readonly repliedAt: string | null;
  readonly repliedByEmail: string | null;
  readonly isHidden: boolean;
  readonly createdAt: string;
}

@Injectable()
export class ReviewsUseCases {
  constructor(
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  private assertAdmin(actor: AuthenticatedUser) {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép kiểm duyệt đánh giá."
      );
    }
  }

  async listReviews(query: ReviewQueryDto): Promise<PaginatedResult<AdminReviewDto>> {
    const db = this.uow.getClient();
    const where: Prisma.ReviewWhereInput = {
      deletedAt: null,
      ...(query.ratingMax !== undefined ? { rating: { lte: query.ratingMax } } : {}),
      ...(query.isHidden !== undefined ? { isHidden: query.isHidden } : {}),
    };

    const [rows, totalItems] = await Promise.all([
      db.review.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ rating: "asc" }, { createdAt: "desc" }],
        include: {
          user: { select: { fullName: true, email: true } },
          garage: { select: { name: true } },
          serviceProduct: { select: { name: true } },
        },
      }),
      db.review.count({ where }),
    ]);

    const items: AdminReviewDto[] = rows.map((r) => ({
      id: r.id,
      customerName: r.user.fullName,
      customerEmail: r.user.email,
      garageId: r.garageId,
      garageName: r.garage?.name ?? null,
      serviceName: r.serviceProduct?.name ?? null,
      vehicleLabel: r.vehicleLabel,
      rating: r.rating,
      comment: r.comment,
      adminReply: r.adminReply,
      repliedAt: r.repliedAt?.toISOString() ?? null,
      repliedByEmail: r.repliedByEmail,
      isHidden: r.isHidden,
      createdAt: r.createdAt.toISOString(),
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

  async replyReview(
    id: string,
    dto: ReplyReviewDto,
    actor: AuthenticatedUser
  ): Promise<AdminReviewDto> {
    this.assertAdmin(actor);

    return this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.review.findUnique({ where: { id } });
      if (!existing) {
        throw new EntityNotFoundException("Đánh giá", id);
      }

      const updated = await client.review.update({
        where: { id },
        data: {
          adminReply: dto.adminReply.trim(),
          repliedAt: new Date(),
          repliedByEmail: actor.email,
        },
        include: {
          user: { select: { fullName: true, email: true } },
          garage: { select: { name: true } },
          serviceProduct: { select: { name: true } },
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.review.replied",
        resourceType: "Review",
        resourceId: id,
        payload: { rating: updated.rating },
      });

      return {
        id: updated.id,
        customerName: updated.user.fullName,
        customerEmail: updated.user.email,
        garageId: updated.garageId,
        garageName: updated.garage?.name ?? null,
        serviceName: updated.serviceProduct?.name ?? null,
        vehicleLabel: updated.vehicleLabel,
        rating: updated.rating,
        comment: updated.comment,
        adminReply: updated.adminReply,
        repliedAt: updated.repliedAt?.toISOString() ?? null,
        repliedByEmail: updated.repliedByEmail,
        isHidden: updated.isHidden,
        createdAt: updated.createdAt.toISOString(),
      };
    });
  }

  async toggleHidden(
    id: string,
    isHidden: boolean,
    actor: AuthenticatedUser
  ): Promise<AdminReviewDto> {
    this.assertAdmin(actor);

    return this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.review.findUnique({ where: { id } });
      if (!existing) {
        throw new EntityNotFoundException("Đánh giá", id);
      }

      const updated = await client.review.update({
        where: { id },
        data: { isHidden },
        include: {
          user: { select: { fullName: true, email: true } },
          garage: { select: { name: true } },
          serviceProduct: { select: { name: true } },
        },
      });

      if (updated.garageId) {
        const agg = await client.review.aggregate({
          where: { garageId: updated.garageId, isHidden: false, deletedAt: null },
          _avg: { rating: true },
          _count: { _all: true },
        });
        await client.garage.update({
          where: { id: updated.garageId },
          data: {
            ratingAvg: agg._avg.rating ?? 5.0,
            reviewCount: agg._count._all,
          },
        });
      }

      if (updated.serviceProductId) {
        const agg = await client.review.aggregate({
          where: {
            serviceProductId: updated.serviceProductId,
            isHidden: false,
            deletedAt: null,
          },
          _avg: { rating: true },
          _count: { _all: true },
        });
        await client.serviceProduct.update({
          where: { id: updated.serviceProductId },
          data: {
            ratingAvg: agg._avg.rating ?? 5.0,
            reviewCount: agg._count._all,
          },
        });
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: isHidden ? "admin.review.hidden" : "admin.review.unhidden",
        resourceType: "Review",
        resourceId: id,
        payload: { isHidden },
      });

      return {
        id: updated.id,
        customerName: updated.user.fullName,
        customerEmail: updated.user.email,
        garageId: updated.garageId,
        garageName: updated.garage?.name ?? null,
        serviceName: updated.serviceProduct?.name ?? null,
        vehicleLabel: updated.vehicleLabel,
        rating: updated.rating,
        comment: updated.comment,
        adminReply: updated.adminReply,
        repliedAt: updated.repliedAt?.toISOString() ?? null,
        repliedByEmail: updated.repliedByEmail,
        isHidden: updated.isHidden,
        createdAt: updated.createdAt.toISOString(),
      };
    });
  }
}

