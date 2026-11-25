import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import type { PaginatedResult } from "@core/domain/repository.interface";
import {
  EntityConflictException,
  EntityNotFoundException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { hashPassword } from "@core/utils/password-hasher";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import type {
  CreateStaffDto,
  StaffQueryDto,
  UpdateTechnicianProfileDto,
} from "../dto/workforce.dto";

export interface StaffMemberDto {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly phone: string | null;
  readonly status: string;
  readonly roles: readonly { readonly code: string; readonly name: string }[];
  readonly technicianProfile: {
    readonly primaryGarageId: string | null;
    readonly primaryGarageName: string | null;
    readonly specialty: string;
    readonly skillLevel: string;
    readonly laborCommissionPct: number;
    readonly hourlyRateVnd: number;
    readonly isActive: boolean;
  } | null;
  readonly performance: {
    readonly completedBookingsCount: number;
    readonly inProgressBookingsCount: number;
    readonly avgDurationMinutes: number | null;
    readonly estimatedCommissionVnd: number;
    readonly activeToolCount: number;
  };
  readonly createdAt: string;
}

@Injectable()
export class WorkforceUseCases {
  constructor(
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  private assertAdmin(actor: AuthenticatedUser) {
    if (!actor.roles.includes("admin")) {
      throw new ForbiddenDomainException(
        "Chỉ quản trị viên mới được phép quản lý nhân sự và kỹ thuật viên."
      );
    }
  }

  async listStaff(query: StaffQueryDto): Promise<PaginatedResult<StaffMemberDto>> {
    const db = this.uow.getClient();
    const staffCodes = query.roleCode
      ? [query.roleCode]
      : ["admin", "ops_staff", "partner_staff", "technician"];

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      userRoles: {
        some: {
          role: { code: { in: staffCodes } },
        },
      },
      ...(query.garageId
        ? { technicianProfile: { primaryGarageId: query.garageId } }
        : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { fullName: { contains: query.search.trim(), mode: "insensitive" } },
              { email: { contains: query.search.trim(), mode: "insensitive" } },
              { phone: { contains: query.search.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, totalItems] = await Promise.all([
      db.user.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: "desc" }],
        include: {
          userRoles: {
            include: { role: { select: { code: true, name: true } } },
          },
          technicianProfile: {
            include: { primaryGarage: { select: { id: true, name: true } } },
          },
          assignedBookings: {
            where: { deletedAt: null },
            select: {
              status: true,
              totalVnd: true,
              workStartedAt: true,
              workCompletedAt: true,
            },
          },
          toolCheckouts: {
            where: { returnedAt: null },
            select: { id: true },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    const items: StaffMemberDto[] = rows.map((u) => {
      const completed = u.assignedBookings.filter(
        (b) => b.status === "COMPLETED"
      );
      const inProgress = u.assignedBookings.filter((b) =>
        ["CHECKED_IN", "IN_PROGRESS", "QC_PENDING"].includes(b.status)
      );
      const durations = completed
        .filter((b) => b.workStartedAt && b.workCompletedAt)
        .map(
          (b) =>
            (b.workCompletedAt!.getTime() - b.workStartedAt!.getTime()) / 60_000
        )
        .filter((m) => m > 0);
      const avgDurationMinutes =
        durations.length > 0
          ? Math.round(durations.reduce((s, m) => s + m, 0) / durations.length)
          : null;

      const commissionPct = u.technicianProfile
        ? Number(u.technicianProfile.laborCommissionPct)
        : 0;
      const estimatedCommissionVnd = completed.reduce(
        (sum, b) => sum + Math.round((b.totalVnd * commissionPct) / 100),
        0
      );

      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        status: u.status,
        roles: u.userRoles.map((ur) => ({
          code: ur.role.code,
          name: ur.role.name,
        })),
        technicianProfile: u.technicianProfile
          ? {
              primaryGarageId: u.technicianProfile.primaryGarageId,
              primaryGarageName:
                u.technicianProfile.primaryGarage?.name ?? null,
              specialty: u.technicianProfile.specialty,
              skillLevel: u.technicianProfile.skillLevel,
              laborCommissionPct: Number(
                u.technicianProfile.laborCommissionPct
              ),
              hourlyRateVnd: u.technicianProfile.hourlyRateVnd,
              isActive: u.technicianProfile.isActive,
            }
          : null,
        performance: {
          completedBookingsCount: completed.length,
          inProgressBookingsCount: inProgress.length,
          avgDurationMinutes,
          estimatedCommissionVnd,
          activeToolCount: u.toolCheckouts.length,
        },
        createdAt: u.createdAt.toISOString(),
      };
    });

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

  async createStaff(
    dto: CreateStaffDto,
    actor: AuthenticatedUser
  ): Promise<StaffMemberDto> {
    this.assertAdmin(actor);
    const id = generateUuidV7();
    const passwordHash = await hashPassword(dto.password);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const dup = await client.user.findUnique({ where: { email: dto.email } });
      if (dup) {
        throw new EntityConflictException(`Email "${dto.email}" đã được sử dụng.`);
      }

      const role = await client.role.findUnique({
        where: { code: dto.roleCode },
      });
      if (!role) {
        throw new EntityNotFoundException("Vai trò", dto.roleCode);
      }

      await client.user.create({
        data: {
          id,
          email: dto.email,
          fullName: dto.fullName,
          phone: dto.phone ?? null,
          passwordHash,
          status: "ACTIVE",
        },
      });

      await client.userRole.create({
        data: { userId: id, roleId: role.id },
      });

      if (dto.roleCode === "technician" || dto.specialty) {
        await client.technicianProfile.create({
          data: {
            userId: id,
            primaryGarageId: dto.primaryGarageId ?? null,
            specialty: dto.specialty ?? "GENERAL_MAINT",
            skillLevel: dto.skillLevel ?? "SENIOR",
            laborCommissionPct: dto.laborCommissionPct ?? 15,
            hourlyRateVnd: dto.hourlyRateVnd ?? 80000,
            isActive: true,
          },
        });
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.staff.created",
        resourceType: "User",
        resourceId: id,
        payload: { email: dto.email, roleCode: dto.roleCode },
      });
    });

    const list = await this.listStaff({ page: 1, limit: 1, search: dto.email });
    return list.items[0]!;
  }

  async updateTechnicianProfile(
    userId: string,
    dto: UpdateTechnicianProfileDto,
    actor: AuthenticatedUser
  ): Promise<StaffMemberDto> {
    this.assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const user = await client.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });
      if (!user) {
        throw new EntityNotFoundException("Nhân sự", userId);
      }

      await client.technicianProfile.upsert({
        where: { userId },
        update: {
          ...(dto.primaryGarageId !== undefined
            ? { primaryGarageId: dto.primaryGarageId }
            : {}),
          ...(dto.specialty !== undefined ? { specialty: dto.specialty } : {}),
          ...(dto.skillLevel !== undefined ? { skillLevel: dto.skillLevel } : {}),
          ...(dto.laborCommissionPct !== undefined
            ? { laborCommissionPct: dto.laborCommissionPct }
            : {}),
          ...(dto.hourlyRateVnd !== undefined
            ? { hourlyRateVnd: dto.hourlyRateVnd }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
        create: {
          userId,
          primaryGarageId: dto.primaryGarageId ?? null,
          specialty: dto.specialty ?? "GENERAL_MAINT",
          skillLevel: dto.skillLevel ?? "SENIOR",
          laborCommissionPct: dto.laborCommissionPct ?? 15,
          hourlyRateVnd: dto.hourlyRateVnd ?? 80000,
          isActive: dto.isActive ?? true,
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.staff.technician_updated",
        resourceType: "TechnicianProfile",
        resourceId: userId,
        payload: {
          email: user.email,
          specialty: dto.specialty,
          skillLevel: dto.skillLevel,
          laborCommissionPct: dto.laborCommissionPct,
        },
      });
    });

    const list = await this.listStaff({ page: 1, limit: 50 });
    return list.items.find((u) => u.id === userId)!;
  }
}
