import { Injectable } from "@nestjs/common";
import { BookingStatus, GarageStatus, PaymentStatus } from "@prisma/client";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";

export interface DashboardAlertDto {
  readonly id: string;
  readonly severity: "warning" | "info" | "danger";
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly count: number;
}

export interface DashboardOverviewDto {
  readonly kpis: {
    readonly totalBookings: number;
    readonly pendingBookings: number;
    readonly confirmedBookings: number;
    readonly inProgressBookings: number;
    readonly completedBookings: number;
    readonly cancelledBookings: number;
    readonly activeGarages: number;
    readonly unverifiedGarages: number;
    readonly registeredCustomers: number;
  };
  readonly revenue: {
    readonly collectedRevenueVnd: number;
    readonly pendingCollectionVnd: number;
    readonly paidBookingCount: number;
    readonly sourceNote: string;
  };
  readonly alerts: readonly DashboardAlertDto[];
  readonly recentBookings: readonly {
    readonly id: string;
    readonly orderCode: string;
    readonly appointmentDate: string;
    readonly appointmentTime: string;
    readonly customerName: string;
    readonly garageName: string;
    readonly vehicleLabel: string;
    readonly status: string;
    readonly paymentStatus: string;
    readonly totalVnd: number;
  }[];
}

@Injectable()
export class GetDashboardOverviewUseCase {
  constructor(private readonly uow: PrismaUnitOfWorkService) {}

  async execute(): Promise<DashboardOverviewDto> {
    const db = this.uow.getClient();

    const [
      statusGroups,
      activeGarages,
      unverifiedGarages,
      registeredCustomers,
      paidAggregate,
      unpaidCompletedAggregate,
      recentBookingsRows,
    ] = await Promise.all([
      db.booking.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.garage.count({
        where: { status: GarageStatus.ACTIVE },
      }),
      db.garage.count({
        where: { verified: false },
      }),
      db.user.count({
        where: {
          userRoles: { some: { role: { code: "customer" } } },
        },
      }),
      db.booking.aggregate({
        where: {
          paymentStatus: PaymentStatus.PAID,
          status: { not: BookingStatus.CANCELLED },
        },
        _sum: { totalVnd: true },
        _count: { _all: true },
      }),
      db.booking.aggregate({
        where: {
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.UNPAID,
        },
        _sum: { totalVnd: true },
        _count: { _all: true },
      }),
      db.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          orderCode: true,
          appointmentDate: true,
          appointmentTime: true,
          customerName: true,
          vehicleLabel: true,
          status: true,
          paymentStatus: true,
          totalVnd: true,
          garage: { select: { name: true } },
        },
      }),
    ]);

    const statusCountMap = new Map<BookingStatus, number>();
    let totalBookings = 0;
    for (const group of statusGroups) {
      statusCountMap.set(group.status, group._count._all);
      totalBookings += group._count._all;
    }

    const pendingBookings =
      statusCountMap.get(BookingStatus.PENDING_CONFIRMATION) ?? 0;
    const confirmedBookings = statusCountMap.get(BookingStatus.CONFIRMED) ?? 0;
    const inProgressBookings =
      statusCountMap.get(BookingStatus.IN_PROGRESS) ?? 0;
    const completedBookings = statusCountMap.get(BookingStatus.COMPLETED) ?? 0;
    const cancelledBookings = statusCountMap.get(BookingStatus.CANCELLED) ?? 0;

    const alerts: DashboardAlertDto[] = [];
    if (pendingBookings > 0) {
      alerts.push({
        id: "pending-bookings",
        severity: "warning",
        title: `${pendingBookings} lịch hẹn đang chờ xác nhận`,
        description:
          "Cần kiểm tra cầu nâng và xác nhận với khách hàng sớm để tránh trễ lịch.",
        href: "/bookings?status=PENDING_CONFIRMATION",
        count: pendingBookings,
      });
    }
    if (unverifiedGarages > 0) {
      alerts.push({
        id: "unverified-garages",
        severity: "info",
        title: `${unverifiedGarages} garage chưa được xác minh`,
        description:
          "Kiểm tra hồ sơ pháp lý, thiết bị và chứng chỉ trước khi bật hiển thị xác minh.",
        href: "/garages?verified=false",
        count: unverifiedGarages,
      });
    }
    if (unpaidCompletedAggregate._count._all > 0) {
      alerts.push({
        id: "completed-unpaid",
        severity: "warning",
        title: `${unpaidCompletedAggregate._count._all} đơn đã hoàn tất nhưng chưa ghi nhận đã thu`,
        description:
          "Cần đối soát thanh toán tại xưởng hoặc hóa đơn với đối tác garage.",
        href: "/bookings?status=COMPLETED",
        count: unpaidCompletedAggregate._count._all,
      });
    }

    return {
      kpis: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        inProgressBookings,
        completedBookings,
        cancelledBookings,
        activeGarages,
        unverifiedGarages,
        registeredCustomers,
      },
      revenue: {
        collectedRevenueVnd: paidAggregate._sum.totalVnd ?? 0,
        pendingCollectionVnd: unpaidCompletedAggregate._sum.totalVnd ?? 0,
        paidBookingCount: paidAggregate._count._all,
        sourceNote:
          "Số liệu tổng hợp trực tiếp từ bảng Bookings (trạng thái PAID / UNPAID). Hệ thống chưa kết nối sổ giao dịch đối soát riêng của cổng thanh toán.",
      },
      alerts,
      recentBookings: recentBookingsRows.map((b) => ({
        id: b.id,
        orderCode: b.orderCode,
        appointmentDate: b.appointmentDate.toISOString().slice(0, 10),
        appointmentTime: b.appointmentTime,
        customerName: b.customerName,
        garageName: b.garage.name,
        vehicleLabel: b.vehicleLabel,
        status: b.status,
        paymentStatus: b.paymentStatus,
        totalVnd: b.totalVnd,
      })),
    };
  }
}

