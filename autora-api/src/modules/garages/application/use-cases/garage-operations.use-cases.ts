import { Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import {
  BusinessRuleViolationException,
  EntityConflictException,
  EntityNotFoundException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import { generateUuidV7 } from "@core/utils/uuid.util";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import {
  GARAGE_REPOSITORY,
  type GarageDetailDto,
  type IGarageRepository,
} from "../../domain/repositories/garage.repository.interface";
import type {
  CreateGarageBayDto,
  SyncGarageServicesDto,
  UpdateGarageBayDto,
} from "../dto/admin-garage.dto";

function assertAdmin(actor: AuthenticatedUser): void {
  if (!actor.roles.includes("admin")) {
    throw new ForbiddenDomainException(
      "Chỉ quản trị viên mới được phép cấu hình xưởng & dịch vụ."
    );
  }
}

@Injectable()
export class ManageGarageBaysUseCase {
  constructor(
    @Inject(GARAGE_REPOSITORY)
    private readonly garageRepo: IGarageRepository,
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  async createBay(
    garageId: string,
    dto: CreateGarageBayDto,
    actor: AuthenticatedUser
  ): Promise<GarageDetailDto> {
    assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const garage = await client.garage.findFirst({
        where: { id: garageId, deletedAt: null },
      });
      if (!garage) throw new EntityNotFoundException("Garage", garageId);

      const code = dto.code.trim().toUpperCase();
      const duplicate = await client.serviceBay.findUnique({
        where: { garageId_code: { garageId, code } },
      });
      if (duplicate) {
        throw new EntityConflictException(
          `Mã cầu nâng "${code}" đã tồn tại tại garage này.`
        );
      }

      const bayCountNow = await client.serviceBay.count({ where: { garageId } });

      const bayId = generateUuidV7();
      await client.serviceBay.create({
        data: {
          id: bayId,
          garageId,
          code,
          name: dto.name.trim(),
          bayType: dto.bayType,
          status: dto.status ?? "AVAILABLE",
          sortOrder: bayCountNow + 1,
          notes: dto.notes?.trim() || null,
        },
      });

      await client.garage.update({
        where: { id: garageId },
        data: { bayCount: bayCountNow + 1 },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.garage.bay_created",
        resourceType: "Garage",
        resourceId: garageId,
        payload: { bayId, code, bayType: dto.bayType },
      });
    });

    const detail = await this.garageRepo.findDetailById(garageId);
    if (!detail) throw new EntityNotFoundException("Garage", garageId);
    return detail;
  }

  async updateBay(
    garageId: string,
    bayId: string,
    dto: UpdateGarageBayDto,
    actor: AuthenticatedUser
  ): Promise<GarageDetailDto> {
    assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const bay = await client.serviceBay.findFirst({
        where: { id: bayId, garageId },
      });
      if (!bay) throw new EntityNotFoundException("Cầu nâng", bayId);

      await client.serviceBay.update({
        where: { id: bayId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.bayType !== undefined ? { bayType: dto.bayType } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes.trim() || null } : {}),
        },
      });

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.garage.bay_updated",
        resourceType: "Garage",
        resourceId: garageId,
        payload: { bayId, status: dto.status, name: dto.name },
      });
    });

    const detail = await this.garageRepo.findDetailById(garageId);
    if (!detail) throw new EntityNotFoundException("Garage", garageId);
    return detail;
  }

  async deleteBay(
    garageId: string,
    bayId: string,
    actor: AuthenticatedUser
  ): Promise<GarageDetailDto> {
    assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const bay = await client.serviceBay.findFirst({
        where: { id: bayId, garageId },
      });
      if (!bay) throw new EntityNotFoundException("Cầu nâng", bayId);

      const activeBookings = await client.booking.count({
        where: {
          bayId,
          deletedAt: null,
          status: { notIn: ["COMPLETED", "CANCELLED", "NO_SHOW"] },
        },
      });
      if (activeBookings > 0) {
        throw new BusinessRuleViolationException(
          "Không thể xóa cầu nâng đang có lịch hẹn chưa hoàn tất.",
          "SERVICE_BAY_HAS_ACTIVE_BOOKINGS"
        );
      }

      await client.serviceBay.delete({ where: { id: bayId } });

      const remaining = await client.serviceBay.count({ where: { garageId } });
      if (remaining > 0) {
        await client.garage.update({
          where: { id: garageId },
          data: { bayCount: remaining },
        });
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.garage.bay_deleted",
        resourceType: "Garage",
        resourceId: garageId,
        payload: { bayId, code: bay.code },
      });
    });

    const detail = await this.garageRepo.findDetailById(garageId);
    if (!detail) throw new EntityNotFoundException("Garage", garageId);
    return detail;
  }
}

@Injectable()
export class SyncGarageServicesUseCase {
  constructor(
    @Inject(GARAGE_REPOSITORY)
    private readonly garageRepo: IGarageRepository,
    private readonly uow: PrismaUnitOfWorkService,
    private readonly auditWriter: AdminAuditWriterService
  ) {}

  async execute(
    garageId: string,
    dto: SyncGarageServicesDto,
    actor: AuthenticatedUser
  ): Promise<GarageDetailDto> {
    assertAdmin(actor);

    await this.uow.runInTransaction(async () => {
      const client = this.uow.getClient();
      const garage = await client.garage.findFirst({
        where: { id: garageId, deletedAt: null },
      });
      if (!garage) throw new EntityNotFoundException("Garage", garageId);

      const requestedIds = dto.items.map((i) => i.serviceProductId);
      if (requestedIds.length > 0) {
        const products = await client.serviceProduct.findMany({
          where: { id: { in: requestedIds }, deletedAt: null },
          select: { id: true },
        });
        if (products.length !== requestedIds.length) {
          throw new BusinessRuleViolationException(
            "Một hoặc nhiều gói dịch vụ không tồn tại.",
            "INVALID_SERVICE_PRODUCT_LIST"
          );
        }
      }

      await client.garageService.deleteMany({
        where: {
          garageId,
          ...(requestedIds.length > 0
            ? { serviceProductId: { notIn: requestedIds } }
            : {}),
        },
      });

      for (const item of dto.items) {
        await client.garageService.upsert({
          where: {
            garageId_serviceProductId: {
              garageId,
              serviceProductId: item.serviceProductId,
            },
          },
          update: {
            customPriceVnd: item.customPriceVnd ?? null,
            isAvailable: item.isAvailable ?? true,
          },
          create: {
            garageId,
            serviceProductId: item.serviceProductId,
            customPriceVnd: item.customPriceVnd ?? null,
            isAvailable: item.isAvailable ?? true,
          },
        });
      }

      await this.auditWriter.record({
        actorUserId: actor.id,
        actorEmail: actor.email,
        eventName: "admin.garage.services_synced",
        resourceType: "Garage",
        resourceId: garageId,
        payload: { serviceCount: dto.items.length },
      });
    });

    const detail = await this.garageRepo.findDetailById(garageId);
    if (!detail) throw new EntityNotFoundException("Garage", garageId);
    return detail;
  }
}

