import {
  apiData,
  apiPaginated,
  type PaginatedResponse,
} from "@/infrastructure/api/api-client";

export type GarageCityCode = "HCM" | "HN" | "DN";
export type GarageStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface GarageListItem {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly district: string;
  readonly cityCode: GarageCityCode;
  readonly cityLabel: string;
  readonly fullAddress: string;
  readonly phone: string | null;
  readonly ratingAvg: number;
  readonly reviewCount: number;
  readonly verified: boolean;
  readonly status: GarageStatus;
  readonly isFeatured: boolean;
  readonly bayCount: number;
  readonly startingPriceVnd: number;
  readonly openHours: string;
  readonly serviceCount: number;
  readonly bookingCount: number;
  readonly updatedAt: string;
}

export interface GarageBay {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly bayType: "QUICK_SERVICE" | "TWO_POST" | "ALIGNMENT_3D" | "DETAILING";
  readonly status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  readonly sortOrder: number;
  readonly notes: string | null;
}

export interface GarageDetail extends GarageListItem {
  readonly coverImageUrl: string;
  readonly certifications: readonly string[];
  readonly summary: string;
  readonly createdAt: string;
  readonly bays: readonly GarageBay[];
  readonly offeredServices: readonly {
    readonly serviceProductId: string;
    readonly sku: string;
    readonly name: string;
    readonly categoryTitle: string;
    readonly basePriceVnd: number;
    readonly customPriceVnd: number | null;
    readonly isAvailable: boolean;
  }[];
  readonly recentBookings: readonly {
    readonly id: string;
    readonly orderCode: string;
    readonly customerName: string;
    readonly appointmentDate: string;
    readonly appointmentTime: string;
    readonly status: string;
    readonly totalVnd: number;
  }[];
}

export interface GarageFilterParams {
  readonly page: number;
  readonly limit: number;
  readonly search?: string;
  readonly cityCode?: string;
  readonly status?: string;
  readonly verified?: string;
}

export function fetchAdminGarages(
  params: GarageFilterParams
): Promise<PaginatedResponse<GarageListItem>> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  qs.set("limit", String(params.limit));
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.cityCode) qs.set("cityCode", params.cityCode);
  if (params.status) qs.set("status", params.status);
  if (params.verified) qs.set("verified", params.verified);
  return apiPaginated<GarageListItem>(`/admin/garages?${qs.toString()}`);
}

export function fetchAdminGarageDetail(id: string): Promise<GarageDetail> {
  return apiData<GarageDetail>(`/admin/garages/${id}`);
}

export interface CreateGaragePayload {
  readonly slug: string;
  readonly name: string;
  readonly district: string;
  readonly cityCode: GarageCityCode;
  readonly cityLabel: string;
  readonly fullAddress: string;
  readonly phone?: string;
  readonly verified?: boolean;
  readonly status?: GarageStatus;
  readonly isFeatured?: boolean;
  readonly coverImageUrl?: string;
  readonly openHours: string;
  readonly bayCount: number;
  readonly startingPriceVnd: number;
  readonly summary: string;
}

export function createAdminGarage(
  payload: CreateGaragePayload
): Promise<GarageDetail> {
  return apiData<GarageDetail>("/admin/garages", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminGarage(
  id: string,
  payload: Partial<{
    name: string;
    district: string;
    cityCode: GarageCityCode;
    cityLabel: string;
    fullAddress: string;
    phone: string;
    openHours: string;
    bayCount: number;
    startingPriceVnd: number;
    isFeatured: boolean;
    coverImageUrl: string;
    summary: string;
  }>
): Promise<GarageDetail> {
  return apiData<GarageDetail>(`/admin/garages/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function updateAdminGarageStatus(
  id: string,
  payload: { status?: GarageStatus; verified?: boolean }
): Promise<GarageDetail> {
  return apiData<GarageDetail>(`/admin/garages/${id}/status`, {
    method: "PATCH",
    body: payload,
  });
}

export function createGarageBay(
  garageId: string,
  payload: {
    code: string;
    name: string;
    bayType: GarageBay["bayType"];
    notes?: string;
  }
): Promise<GarageDetail> {
  return apiData<GarageDetail>(`/admin/garages/${garageId}/bays`, {
    method: "POST",
    body: payload,
  });
}

export function updateGarageBay(
  garageId: string,
  bayId: string,
  payload: Partial<{
    name: string;
    bayType: GarageBay["bayType"];
    status: GarageBay["status"];
    notes: string;
  }>
): Promise<GarageDetail> {
  return apiData<GarageDetail>(`/admin/garages/${garageId}/bays/${bayId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteGarageBay(
  garageId: string,
  bayId: string
): Promise<GarageDetail> {
  return apiData<GarageDetail>(`/admin/garages/${garageId}/bays/${bayId}`, {
    method: "DELETE",
  });
}

export function syncGarageServices(
  garageId: string,
  items: readonly {
    serviceProductId: string;
    customPriceVnd?: number | null;
    isAvailable?: boolean;
  }[]
): Promise<GarageDetail> {
  return apiData<GarageDetail>(`/admin/garages/${garageId}/services`, {
    method: "PUT",
    body: { items },
  });
}

