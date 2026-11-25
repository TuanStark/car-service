import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import type { PaginatedResult } from "@core/domain/repository.interface";
import {
  EntityConflictException,
  EntityNotFoundException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import type {
  ArticleQueryDto,
  CreateArticleDto,
  CreateContactInquiryDto,
  UpdateArticleDto,
  UpdateContactInquiryDto,
} from "../dto/content.dto";

export function toVietnameseSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export interface ArticleDto {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly contentMarkdown: string;
  readonly coverImageUrl: string;
  readonly category: string;
  readonly status: string;
  readonly publishedAt: string | null;
  readonly authorEmail: string | null;
  readonly createdAt: string;
}

export interface ContactInquiryDto {
  readonly id: string;
  readonly fullName: string;
  readonly phone: string;
  readonly email: string | null;
  readonly vehicleInfo: string | null;
  readonly message: string;
  readonly status: string;
  readonly staffNote: string | null;
  readonly assignedToEmail: string | null;
  readonly createdAt: string;
}

@Injectable()
export class ContentUseCases {
  constructor(
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  private assertAdmin(actor: AuthenticatedUser) {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép quản lý nội dung & lead."
      );
    }
  }

  async listArticles(query: ArticleQueryDto): Promise<PaginatedResult<ArticleDto>> {
    const db = this.uow.getClient();
    const where: Prisma.ArticleWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
    };

    const [rows, totalItems] = await Promise.all([
      db.article.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: "desc" }],
      }),
      db.article.count({ where }),
    ]);

    const items: ArticleDto[] = rows.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      contentMarkdown: a.contentMarkdown,
      coverImageUrl: a.coverImageUrl,
      category: a.category,
      status: a.status,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      authorEmail: a.authorEmail,
      createdAt: a.createdAt.toISOString(),
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

  async createArticle(
    dto: CreateArticleDto,
    actor: AuthenticatedUser
  ): Promise<ArticleDto> {
    this.assertAdmin(actor);
    const id = generateUuidV7();
    const slug = dto.slug?.trim() || toVietnameseSlug(dto.title);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const dup = await client.article.findUnique({ where: { slug } });
      if (dup) {
        throw new EntityConflictException(`Slug bài viết "${slug}" đã tồn tại.`);
      }

      const status = dto.status ?? "PUBLISHED";
      await client.article.create({
        data: {
          id,
          slug,
          title: dto.title,
          excerpt: dto.excerpt,
          contentMarkdown: dto.contentMarkdown,
          coverImageUrl: dto.coverImageUrl,
          category: dto.category,
          status,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
          authorEmail: actor.email,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.article.created",
        resourceType: "Article",
        resourceId: id,
        payload: { slug, title: dto.title, status },
      });
    });

    const list = await this.listArticles({ page: 1, limit: 20 });
    return list.items.find((a) => a.id === id)!;
  }

  async updateArticle(
    id: string,
    dto: UpdateArticleDto,
    actor: AuthenticatedUser
  ): Promise<ArticleDto> {
    this.assertAdmin(actor);

    return this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.article.findUnique({ where: { id } });
      if (!existing) {
        throw new EntityNotFoundException("Bài viết", id);
      }

      const nextStatus = dto.status ?? existing.status;
      const updated = await client.article.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.excerpt !== undefined ? { excerpt: dto.excerpt } : {}),
          ...(dto.contentMarkdown !== undefined
            ? { contentMarkdown: dto.contentMarkdown }
            : {}),
          ...(dto.coverImageUrl !== undefined
            ? { coverImageUrl: dto.coverImageUrl }
            : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(nextStatus === "PUBLISHED" && !existing.publishedAt
            ? { publishedAt: new Date() }
            : {}),
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.article.updated",
        resourceType: "Article",
        resourceId: id,
        payload: { title: updated.title, status: updated.status },
      });

      return {
        id: updated.id,
        slug: updated.slug,
        title: updated.title,
        excerpt: updated.excerpt,
        contentMarkdown: updated.contentMarkdown,
        coverImageUrl: updated.coverImageUrl,
        category: updated.category,
        status: updated.status,
        publishedAt: updated.publishedAt?.toISOString() ?? null,
        authorEmail: updated.authorEmail,
        createdAt: updated.createdAt.toISOString(),
      };
    });
  }

  async deleteArticle(id: string, actor: AuthenticatedUser): Promise<void> {
    this.assertAdmin(actor);
    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.article.findUnique({ where: { id } });
      if (!existing) throw new EntityNotFoundException("Bài viết", id);
      await client.article.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }

  async listLeads(): Promise<ContactInquiryDto[]> {
    const db = this.uow.getClient();
    const rows = await db.contactInquiry.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    });
    return rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      phone: r.phone,
      email: r.email,
      vehicleInfo: r.vehicleInfo,
      message: r.message,
      status: r.status,
      staffNote: r.staffNote,
      assignedToEmail: r.assignedToEmail,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createPublicInquiry(
    dto: CreateContactInquiryDto
  ): Promise<ContactInquiryDto> {
    const db = this.uow.getClient();
    const row = await db.contactInquiry.create({
      data: {
        id: generateUuidV7(),
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email ?? null,
        vehicleInfo: dto.vehicleInfo ?? null,
        message: dto.message,
        status: "NEW",
      },
    });
    return {
      id: row.id,
      fullName: row.fullName,
      phone: row.phone,
      email: row.email,
      vehicleInfo: row.vehicleInfo,
      message: row.message,
      status: row.status,
      staffNote: row.staffNote,
      assignedToEmail: row.assignedToEmail,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateLead(
    id: string,
    dto: UpdateContactInquiryDto,
    actor: AuthenticatedUser
  ): Promise<ContactInquiryDto> {
    this.assertAdmin(actor);

    return this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const existing = await client.contactInquiry.findUnique({ where: { id } });
      if (!existing) throw new EntityNotFoundException("Yêu cầu liên hệ", id);

      const updated = await client.contactInquiry.update({
        where: { id },
        data: {
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.staffNote !== undefined ? { staffNote: dto.staffNote } : {}),
          assignedToEmail: actor.email,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.lead.updated",
        resourceType: "ContactInquiry",
        resourceId: id,
        payload: { status: updated.status },
      });

      return {
        id: updated.id,
        fullName: updated.fullName,
        phone: updated.phone,
        email: updated.email,
        vehicleInfo: updated.vehicleInfo,
        message: updated.message,
        status: updated.status,
        staffNote: updated.staffNote,
        assignedToEmail: updated.assignedToEmail,
        createdAt: updated.createdAt.toISOString(),
      };
    });
  }
}

