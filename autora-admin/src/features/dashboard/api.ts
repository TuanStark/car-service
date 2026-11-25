import { apiData } from "@/infrastructure/api/api-client";

export interface DashboardOverview {
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
  readonly alerts: readonly {
    readonly id: string;
    readonly severity: "warning" | "info" | "danger";
    readonly title: string;
    readonly description: string;
    readonly href: string;
    readonly count: number;
  }[];
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

export function fetchDashboardOverview(): Promise<DashboardOverview> {
  return apiData<DashboardOverview>("/admin/dashboard/overview");
}

