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

export interface GarageDetail extends GarageListItem {
  readonly coverImageUrl: string;
  readonly certifications: readonly string[];
  readonly summary: string;
  readonly createdAt: string;
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

