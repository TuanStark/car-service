import {
  apiData,
  apiPaginated,
  type PaginatedResponse,
} from "@/infrastructure/api/api-client";

export type CouponDiscountType = "PERCENTAGE" | "FIXED_VND";

export interface CouponDto {
  readonly id: string;
  readonly code: string;
  readonly description: string;
  readonly discountType: CouponDiscountType;
  readonly discountValue: number;
  readonly maxDiscountVnd: number | null;
  readonly minOrderVnd: number;
  readonly usageLimit: number | null;
  readonly usedCount: number;
  readonly startsAt: string;
  readonly expiresAt: string;
  readonly isActive: boolean;
}

export function fetchAdminCoupons(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResponse<CouponDto>> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 20),
  });
  if (params?.search?.trim()) qs.set("search", params.search.trim());
  return apiPaginated<CouponDto>(`/admin/promotions?${qs.toString()}`);
}

export function createAdminCoupon(payload: {
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountVnd?: number;
  minOrderVnd?: number;
  usageLimit?: number;
  startsAt: string;
  expiresAt: string;
}): Promise<CouponDto> {
  return apiData<CouponDto>("/admin/promotions", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminCoupon(
  id: string,
  payload: { isActive?: boolean; description?: string }
): Promise<CouponDto> {
  return apiData<CouponDto>(`/admin/promotions/${id}`, {
    method: "PATCH",
    body: payload,
  });
}
