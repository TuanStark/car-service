import { describe, expect, it, vi } from "vitest";
import {
  BusinessRuleViolationException,
  EntityConflictException,
  ForbiddenDomainException,
} from "@core/exceptions/domain.exception";
import type { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import type { AdminAuditWriterService } from "@modules/audit/application/services/admin-audit-writer.service";
import { UpdateBookingStatusUseCase } from "@modules/bookings/application/use-cases/update-booking-status.use-case";
import type {
  BookingDetailDto,
  IBookingRepository,
} from "@modules/bookings/domain/repositories/booking.repository.interface";

function createSampleBooking(
  overrides?: Partial<BookingDetailDto>
): BookingDetailDto {
  return {
    id: "booking-1",
    orderCode: "ATR-2611-001",
    appointmentDate: "2026-11-26",
    appointmentTime: "09:30",
    customerName: "Nguyễn Đăng Khoa",
    customerPhone: "0909688912",
    userId: "user-1",
    userEmail: "khoa@autora.vn",
    garageId: "garage-1",
    garageName: "SAIGON MOTORWERKS",
    garageAddress: "88 Nguyễn Thị Thập, Q7",
    bayId: null,
    bayCode: null,
    bayName: null,
    vehicleId: "veh-1",
    vehicleLabel: "Mazda CX-5 (2023)",
    licensePlate: "51K-682.39",
    odoKm: 24800,
    paymentMethod: "PAY_AT_GARAGE",
    paymentStatus: "UNPAID",
    status: "PENDING_CONFIRMATION",
    customerApprovalStatus: "NONE",
    allowedNextStatuses: ["CONFIRMED", "CANCELLED"],
    subtotalVnd: 450000,
    discountVnd: 0,
    totalVnd: 450000,
    notes: null,
    checkedInAt: null,
    workStartedAt: null,
    workCompletedAt: null,
    rescheduleCount: 0,
    version: 1,
    createdAt: "2026-11-25T10:00:00Z",
    updatedAt: "2026-11-25T10:00:00Z",
    items: [],
    inspections: [],
    paymentLogs: [],
    statusHistory: [],
    partUsages: [],
    cogsTotalVnd: 0,
    ...overrides,
  };
}

describe("UpdateBookingStatusUseCase", () => {
  const adminActor = {
    id: "admin-1",
    email: "admin@autora.vn",
    fullName: "Admin",
    roles: ["admin"],
    jti: "jti-1",
    exp: 9999999999,
  };

  const mockUow = {
    runInTransaction: vi.fn(async (work: () => Promise<unknown>) => work()),
  } as unknown as PrismaUnitOfWorkService;

  it("denies non-admin actor at use-case boundary", async () => {
    const repo: IBookingRepository = {
      findManyAdmin: vi.fn(),
      findDetailById: vi.fn(),
      transitionStatusWithVersion: vi.fn(),
    };
    const audit = { record: vi.fn() } as unknown as AdminAuditWriterService;
    const useCase = new UpdateBookingStatusUseCase(repo, mockUow, audit);

    await expect(
      useCase.execute(
        "booking-1",
        { status: "CONFIRMED", expectedVersion: 1 },
        { ...adminActor, roles: ["customer"] }
      )
    ).rejects.toThrowError(ForbiddenDomainException);
  });

  it("rejects stale expectedVersion with EntityConflictException (409)", async () => {
    const repo: IBookingRepository = {
      findManyAdmin: vi.fn(),
      findDetailById: vi.fn().mockResolvedValue(createSampleBooking({ version: 2 })),
      transitionStatusWithVersion: vi.fn(),
    };
    const audit = { record: vi.fn() } as unknown as AdminAuditWriterService;
    const useCase = new UpdateBookingStatusUseCase(repo, mockUow, audit);

    await expect(
      useCase.execute(
        "booking-1",
        { status: "CONFIRMED", expectedVersion: 1 },
        adminActor
      )
    ).rejects.toThrowError(EntityConflictException);
  });

  it("updates status atomically and writes audit log", async () => {
    const initial = createSampleBooking({ status: "PENDING_CONFIRMATION", version: 1 });
    const confirmed = createSampleBooking({
      status: "CONFIRMED",
      version: 2,
      allowedNextStatuses: ["IN_PROGRESS", "CANCELLED"],
    });

    const repo: IBookingRepository = {
      findManyAdmin: vi.fn(),
      findDetailById: vi
        .fn()
        .mockResolvedValueOnce(initial)
        .mockResolvedValueOnce(confirmed),
      transitionStatusWithVersion: vi.fn().mockResolvedValue(true),
    };
    const audit = { record: vi.fn() } as unknown as AdminAuditWriterService;
    const useCase = new UpdateBookingStatusUseCase(repo, mockUow, audit);

    const res = await useCase.execute(
      "booking-1",
      { status: "CONFIRMED", expectedVersion: 1, reason: "Đã kiểm tra cầu nâng" },
      adminActor
    );

    expect(res.status).toBe("CONFIRMED");
    expect(res.version).toBe(2);
    expect(audit.record).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid business transition", async () => {
    const repo: IBookingRepository = {
      findManyAdmin: vi.fn(),
      findDetailById: vi
        .fn()
        .mockResolvedValue(createSampleBooking({ status: "COMPLETED", version: 1 })),
      transitionStatusWithVersion: vi.fn(),
    };
    const audit = { record: vi.fn() } as unknown as AdminAuditWriterService;
    const useCase = new UpdateBookingStatusUseCase(repo, mockUow, audit);

    await expect(
      useCase.execute(
        "booking-1",
        { status: "CANCELLED", expectedVersion: 1, reason: "Test" },
        adminActor
      )
    ).rejects.toThrowError(BusinessRuleViolationException);
  });
});

