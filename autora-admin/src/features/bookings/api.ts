import {
  apiData,
  apiPaginated,
  type PaginatedResponse,
} from "@/infrastructure/api/api-client";

export type BookingStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface BookingListItem {
  readonly id: string;
  readonly orderCode: string;
  readonly appointmentDate: string;
  readonly appointmentTime: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly vehicleLabel: string;
  readonly licensePlate: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly status: BookingStatus;
  readonly paymentMethod: string;
  readonly paymentStatus: string;
  readonly totalVnd: number;
  readonly version: number;
  readonly itemCount: number;
  readonly createdAt: string;
}

export interface BookingDetail {
  readonly id: string;
  readonly orderCode: string;
  readonly appointmentDate: string;
  readonly appointmentTime: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly userId: string | null;
  readonly userEmail: string | null;
  readonly garageId: string;
  readonly garageName: string;
  readonly garageAddress: string;
  readonly vehicleId: string | null;
  readonly vehicleLabel: string;
  readonly licensePlate: string;
  readonly odoKm: number;
  readonly paymentMethod: string;
  readonly paymentStatus: string;
  readonly status: BookingStatus;
  readonly allowedNextStatuses: readonly BookingStatus[];
  readonly subtotalVnd: number;
  readonly discountVnd: number;
  readonly totalVnd: number;
  readonly notes: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly items: readonly {
    readonly id: string;
    readonly serviceProductId: string;
    readonly serviceNameSnap: string;
    readonly skuSnap: string;
    readonly unitPriceVnd: number;
    readonly quantity: number;
    readonly lineTotalVnd: number;
  }[];
  readonly statusHistory: readonly {
    readonly id: string;
    readonly fromStatus: BookingStatus | null;
    readonly toStatus: BookingStatus;
    readonly reason: string | null;
    readonly changedByEmail: string | null;
    readonly createdAt: string;
  }[];
}

export interface BookingListParams {
  readonly page: number;
  readonly limit: number;
  readonly search?: string;
  readonly status?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

export function fetchAdminBookings(
  params: BookingListParams
): Promise<PaginatedResponse<BookingListItem>> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  qs.set("limit", String(params.limit));
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.status) qs.set("status", params.status);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  return apiPaginated<BookingListItem>(`/admin/bookings?${qs.toString()}`);
}

export function fetchAdminBookingDetail(id: string): Promise<BookingDetail> {
  return apiData<BookingDetail>(`/admin/bookings/${id}`);
}

export function updateAdminBookingStatus(
  id: string,
  payload: {
    readonly status: BookingStatus;
    readonly expectedVersion: number;
    readonly reason?: string;
  }
): Promise<BookingDetail> {
  return apiData<BookingDetail>(`/admin/bookings/${id}/status`, {
    method: "PATCH",
    body: payload,
  });
}

