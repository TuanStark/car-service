import {
  apiData,
  apiPaginated,
  type PaginatedResponse,
} from "@/infrastructure/api/api-client";

export type BookingStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "WAITING_APPROVAL"
  | "QC_PENDING"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type PaymentMethod = "PAY_AT_GARAGE" | "VIETQR" | "VNPAY";

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
  readonly bayId: string | null;
  readonly bayName: string | null;
  readonly status: BookingStatus;
  readonly paymentMethod: string;
  readonly paymentStatus: string;
  readonly totalVnd: number;
  readonly version: number;
  readonly itemCount: number;
  readonly createdAt: string;
}

export interface BookingInspectionItem {
  readonly id: string;
  readonly phase: "CHECK_IN" | "CHECK_OUT";
  readonly odoKm: number | null;
  readonly fuelLevel: string | null;
  readonly checklist: readonly {
    readonly label: string;
    readonly status: "OK" | "ATTENTION" | "REPLACE";
    readonly note?: string;
  }[];
  readonly photoUrls: readonly string[];
  readonly notes: string | null;
  readonly inspectedByEmail: string | null;
  readonly createdAt: string;
}

export interface BookingPaymentLogItem {
  readonly id: string;
  readonly action: "CAPTURE" | "REFUND";
  readonly method: string;
  readonly amountVnd: number;
  readonly referenceCode: string | null;
  readonly reason: string | null;
  readonly recordedByEmail: string | null;
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
  readonly bayId: string | null;
  readonly bayCode: string | null;
  readonly bayName: string | null;
  readonly vehicleId: string | null;
  readonly vehicleLabel: string;
  readonly licensePlate: string;
  readonly odoKm: number;
  readonly paymentMethod: string;
  readonly paymentStatus: string;
  readonly status: BookingStatus;
  readonly customerApprovalStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  readonly allowedNextStatuses: readonly BookingStatus[];
  readonly subtotalVnd: number;
  readonly discountVnd: number;
  readonly totalVnd: number;
  readonly notes: string | null;
  readonly checkedInAt: string | null;
  readonly workStartedAt: string | null;
  readonly workCompletedAt: string | null;
  readonly rescheduleCount: number;
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
  readonly inspections: readonly BookingInspectionItem[];
  readonly paymentLogs: readonly BookingPaymentLogItem[];
  readonly partUsages: readonly BookingPartUsageItem[];
  readonly cogsTotalVnd: number;
}

export interface BookingPartUsageItem {
  readonly id: string;
  readonly partItemId: string;
  readonly sku: string;
  readonly partName: string;
  readonly unit: string;
  readonly qtyUsed: number;
  readonly unitCostVnd: number;
  readonly unitSellVnd: number;
  readonly lineCostVnd: number;
  readonly issuedByEmail: string | null;
  readonly createdAt: string;
}

export interface DispatchGarageSchedule {
  readonly garageId: string;
  readonly garageName: string;
  readonly bayCount: number;
  readonly bays: readonly {
    readonly id: string;
    readonly code: string;
    readonly name: string;
    readonly bayType: string;
    readonly status: string;
  }[];
  readonly slots: readonly {
    readonly time: string;
    readonly activeCount: number;
    readonly bayCount: number;
    readonly bookings: readonly {
      readonly id: string;
      readonly orderCode: string;
      readonly customerName: string;
      readonly vehicleLabel: string;
      readonly licensePlate: string;
      readonly status: BookingStatus;
      readonly totalVnd: number;
      readonly bayId: string | null;
      readonly appointmentTime: string;
    }[];
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

export function fetchDispatchSchedule(params: {
  readonly date: string;
  readonly garageId?: string;
}): Promise<DispatchGarageSchedule[]> {
  const qs = new URLSearchParams({ date: params.date });
  if (params.garageId) qs.set("garageId", params.garageId);
  return apiData<DispatchGarageSchedule[]>(
    `/admin/bookings/schedule?${qs.toString()}`
  );
}

export function createAdminBooking(payload: {
  garageId: string;
  bayId?: string;
  appointmentDate: string;
  appointmentTime: string;
  customerName: string;
  customerPhone: string;
  vehicleLabel: string;
  licensePlate: string;
  odoKm: number;
  paymentMethod?: PaymentMethod;
  initialStatus?: "PENDING_CONFIRMATION" | "CONFIRMED" | "CHECKED_IN";
  notes?: string;
  items: { serviceProductId: string; quantity?: number }[];
}): Promise<BookingDetail> {
  return apiData<BookingDetail>("/admin/bookings", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminBookingStatus(
  id: string,
  payload: {
    status: BookingStatus;
    expectedVersion: number;
    reason?: string;
  }
): Promise<BookingDetail> {
  return apiData<BookingDetail>(`/admin/bookings/${id}/status`, {
    method: "PATCH",
    body: payload,
  });
}

export function rescheduleAdminBooking(
  id: string,
  payload: {
    appointmentDate: string;
    appointmentTime: string;
    garageId?: string;
    bayId?: string | null;
    odoKm?: number;
    expectedVersion: number;
    reason?: string;
  }
): Promise<BookingDetail> {
  return apiData<BookingDetail>(`/admin/bookings/${id}/reschedule`, {
    method: "PATCH",
    body: payload,
  });
}

export function recordAdminBookingPayment(
  id: string,
  payload: {
    action: "CAPTURE" | "REFUND";
    method: PaymentMethod;
    referenceCode?: string;
    reason?: string;
    expectedVersion: number;
  }
): Promise<BookingDetail> {
  return apiData<BookingDetail>(`/admin/bookings/${id}/payment`, {
    method: "PATCH",
    body: payload,
  });
}

export function addAdminBookingItem(
  id: string,
  payload: {
    serviceProductId: string;
    quantity?: number;
    customUnitPriceVnd?: number;
    markWaitingApproval?: boolean;
    expectedVersion: number;
  }
): Promise<BookingDetail> {
  return apiData<BookingDetail>(`/admin/bookings/${id}/items`, {
    method: "POST",
    body: payload,
  });
}

export function removeAdminBookingItem(
  id: string,
  itemId: string,
  expectedVersion: number
): Promise<BookingDetail> {
  return apiData<BookingDetail>(
    `/admin/bookings/${id}/items/${itemId}?expectedVersion=${expectedVersion}`,
    { method: "DELETE" }
  );
}

export function recordAdminBookingInspection(
  id: string,
  payload: {
    phase: "CHECK_IN" | "CHECK_OUT";
    odoKm?: number;
    fuelLevel?: "E" | "1/4" | "1/2" | "3/4" | "F";
    photoUrls?: string[];
    notes?: string;
  }
): Promise<BookingDetail> {
  return apiData<BookingDetail>(`/admin/bookings/${id}/inspections`, {
    method: "POST",
    body: payload,
  });
}

export function issueBookingBomParts(id: string): Promise<BookingDetail> {
  return apiData<BookingDetail>(`/admin/bookings/${id}/parts/issue-bom`, {
    method: "POST",
  });
}

export function issueBookingManualPart(
  id: string,
  payload: { partItemId: string; qtyUsed: number; note?: string }
): Promise<BookingDetail> {
  return apiData<BookingDetail>(`/admin/bookings/${id}/parts`, {
    method: "POST",
    body: payload,
  });
}

export function returnBookingPart(
  id: string,
  usageId: string
): Promise<BookingDetail> {
  return apiData<BookingDetail>(`/admin/bookings/${id}/parts/${usageId}`, {
    method: "DELETE",
  });
}
