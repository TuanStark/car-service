import {
  apiData,
  apiPaginated,
  type PaginatedResponse,
} from "@/infrastructure/api/api-client";

export type EquipmentCategory =
  | "LIFT"
  | "DIAGNOSTIC_SCANNER"
  | "WHEEL_ALIGNMENT"
  | "AC_MACHINE"
  | "PAINT_BOOTH"
  | "SPECIAL_TOOL";

export type EquipmentStatus =
  | "OPERATIONAL"
  | "IN_USE"
  | "MAINTENANCE"
  | "BROKEN";

export type EquipmentMaintenanceType = "ROUTINE" | "CALIBRATION" | "REPAIR";
export type ToolReturnCondition = "GOOD" | "DAMAGED" | "MISSING";

export interface EquipmentItemDto {
  readonly id: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly serviceBayId: string | null;
  readonly serviceBayCode: string | null;
  readonly serviceBayName: string | null;
  readonly assetCode: string;
  readonly name: string;
  readonly category: EquipmentCategory;
  readonly brandModel: string | null;
  readonly serialNumber: string | null;
  readonly status: EquipmentStatus;
  readonly purchaseCostVnd: number;
  readonly nextMaintenanceAt: string | null;
  readonly calibrationDueAt: string | null;
  readonly isDueSoon: boolean;
  readonly notes: string | null;
  readonly activeCheckout: {
    readonly id: string;
    readonly technicianUserId: string;
    readonly technicianName: string;
    readonly technicianEmail: string;
    readonly checkedOutAt: string;
    readonly expectedReturnAt: string | null;
    readonly bookingOrderCode: string | null;
    readonly notes: string | null;
  } | null;
  readonly maintenanceCount: number;
  readonly updatedAt: string;
}

export function fetchAdminEquipment(params?: {
  page?: number;
  limit?: number;
  garageId?: string;
  category?: EquipmentCategory;
  status?: EquipmentStatus;
  checkedOutOnly?: boolean;
  dueSoonOnly?: boolean;
  search?: string;
}): Promise<PaginatedResponse<EquipmentItemDto>> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 25),
  });
  if (params?.garageId) qs.set("garageId", params.garageId);
  if (params?.category) qs.set("category", params.category);
  if (params?.status) qs.set("status", params.status);
  if (params?.checkedOutOnly) qs.set("checkedOutOnly", "true");
  if (params?.dueSoonOnly) qs.set("dueSoonOnly", "true");
  if (params?.search?.trim()) qs.set("search", params.search.trim());
  return apiPaginated<EquipmentItemDto>(`/admin/equipment?${qs.toString()}`);
}

export function createAdminEquipment(payload: {
  garageId: string;
  serviceBayId?: string;
  assetCode: string;
  name: string;
  category: EquipmentCategory;
  brandModel?: string;
  serialNumber?: string;
  purchaseCostVnd?: number;
  nextMaintenanceAt?: string;
  calibrationDueAt?: string;
  notes?: string;
}): Promise<EquipmentItemDto> {
  return apiData<EquipmentItemDto>("/admin/equipment", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminEquipment(
  id: string,
  payload: {
    status?: EquipmentStatus;
    notes?: string;
  }
): Promise<{
  equipment: EquipmentItemDto;
  lockedBayCode: string | null;
  affectedBookingsCount: number;
}> {
  return apiData(`/admin/equipment/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function recordEquipmentMaintenance(
  id: string,
  payload: {
    maintenanceType: EquipmentMaintenanceType;
    costVnd: number;
    vendorName?: string;
    nextDueAt?: string;
    notes?: string;
    restoreOperational?: boolean;
  }
): Promise<EquipmentItemDto> {
  return apiData<EquipmentItemDto>(`/admin/equipment/${id}/maintenance`, {
    method: "POST",
    body: payload,
  });
}

export function checkoutEquipmentTool(
  id: string,
  payload: {
    technicianUserId: string;
    notes?: string;
  }
): Promise<EquipmentItemDto> {
  return apiData<EquipmentItemDto>(`/admin/equipment/${id}/checkout`, {
    method: "POST",
    body: payload,
  });
}

export function returnEquipmentTool(
  id: string,
  payload: {
    returnCondition: ToolReturnCondition;
    notes?: string;
  }
): Promise<EquipmentItemDto> {
  return apiData<EquipmentItemDto>(`/admin/equipment/${id}/return`, {
    method: "POST",
    body: payload,
  });
}

