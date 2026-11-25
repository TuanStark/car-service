import { apiData, apiPaginated, type PaginatedResponse } from "@/infrastructure/api/api-client";

export type CustomerStatusValue = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface CustomerListItem {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly status: CustomerStatusValue;
  readonly lastLoginAt: string | null;
  readonly createdAt: string;
  readonly vehicleCount: number;
  readonly bookingCount: number;
}

export interface CustomerProfile extends CustomerListItem {
  readonly vehicles: readonly {
    readonly id: string;
    readonly brand: string;
    readonly model: string;
    readonly year: string;
    readonly bodyType: string;
    readonly licensePlate: string;
    readonly currentOdoKm: number;
    readonly isPrimary: boolean;
  }[];
  readonly bookings: readonly {
    readonly id: string;
    readonly orderCode: string;
    readonly appointmentDate: string;
    readonly appointmentTime: string;
    readonly garageName: string;
    readonly vehicleLabel: string;
    readonly status: string;
    readonly paymentStatus: string;
    readonly totalVnd: number;
  }[];
}

export function fetchAdminCustomers(params: {
  readonly page: number;
  readonly limit: number;
  readonly search?: string;
  readonly status?: string;
}): Promise<PaginatedResponse<CustomerListItem>> {
  const qs = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.status) qs.set("status", params.status);
  return apiPaginated<CustomerListItem>(`/admin/customers?${qs.toString()}`);
}

export function fetchAdminCustomerProfile(id: string): Promise<CustomerProfile> {
  return apiData<CustomerProfile>(`/admin/customers/${id}`);
}

