import { apiData, apiPaginated, type PaginatedResponse } from "@/infrastructure/api/api-client";

export type ServiceBadgeType = "BEST_SELLER" | "PROMO" | "NEW" | "RECOMMENDED" | null;
export type VehicleBodyEnum = "ALL" | "SEDAN" | "SUV" | "MPV" | "EV";

export interface ServiceSpecification {
  readonly label: string;
  readonly value: string;
}

export interface ServiceCategoryOption {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly shortLabel: string;
}

export interface ServiceProductItem {
  readonly id: string;
  readonly sku: string;
  readonly slug: string;
  readonly categoryId: string;
  readonly categoryCode: string;
  readonly categoryLabel: string;
  readonly name: string;
  readonly shortSummary: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly galleryUrls: readonly string[];
  readonly priceVnd: number;
  readonly originalPriceVnd: number | null;
  readonly discountPercent: number | null;
  readonly badge: ServiceBadgeType;
  readonly ratingAvg: number;
  readonly reviewCount: number;
  readonly bookedCount: number;
  readonly estimatedDuration: string;
  readonly warrantyLabel: string;
  readonly compatibleVehicles: readonly VehicleBodyEnum[];
  readonly compatibleBrandsLabel: string;
  readonly includedSteps: readonly string[];
  readonly specifications: readonly ServiceSpecification[];
  readonly isFeatured: boolean;
  readonly isActive: boolean;
}

export interface CreateServicePayload {
  readonly sku: string;
  readonly slug: string;
  readonly categoryId: string;
  readonly name: string;
  readonly shortSummary: string;
  readonly description: string;
  readonly imageUrl?: string;
  readonly galleryUrls?: readonly string[];
  readonly priceVnd: number;
  readonly originalPriceVnd?: number | null;
  readonly badge?: ServiceBadgeType;
  readonly estimatedDuration: string;
  readonly warrantyLabel: string;
  readonly compatibleVehicles?: readonly VehicleBodyEnum[];
  readonly compatibleBrandsLabel?: string;
  readonly includedSteps?: readonly string[];
  readonly isFeatured?: boolean;
  readonly isActive?: boolean;
}

export type UpdateServicePayload = Partial<Omit<CreateServicePayload, "isActive">>;

export function fetchServiceCategories(): Promise<ServiceCategoryOption[]> {
  return apiData<ServiceCategoryOption[]>("/admin/services/categories");
}

export function fetchAdminServices(params: {
  readonly page: number;
  readonly limit: number;
  readonly query?: string;
  readonly categoryId?: string;
  readonly isActive?: string;
}): Promise<PaginatedResponse<ServiceProductItem>> {
  const qs = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.query?.trim()) qs.set("query", params.query.trim());
  if (params.categoryId) qs.set("categoryId", params.categoryId);
  if (params.isActive === "true" || params.isActive === "false") {
    qs.set("isActive", params.isActive);
  }
  return apiPaginated<ServiceProductItem>(`/admin/services?${qs.toString()}`);
}

export function fetchAdminServiceDetail(id: string): Promise<ServiceProductItem> {
  return apiData<ServiceProductItem>(`/admin/services/${id}`);
}

export function createAdminService(
  payload: CreateServicePayload
): Promise<ServiceProductItem> {
  return apiData<ServiceProductItem>("/admin/services", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminService(
  id: string,
  payload: UpdateServicePayload
): Promise<ServiceProductItem> {
  return apiData<ServiceProductItem>(`/admin/services/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function toggleAdminServiceStatus(
  id: string,
  isActive: boolean
): Promise<ServiceProductItem> {
  return apiData<ServiceProductItem>(`/admin/services/${id}/status`, {
    method: "PATCH",
    body: { isActive },
  });
}

