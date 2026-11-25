import {
  apiData,
  apiPaginated,
  type PaginatedResponse,
} from "@/infrastructure/api/api-client";

export interface AdminReviewDto {
  readonly id: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly garageId: string | null;
  readonly garageName: string | null;
  readonly serviceName: string | null;
  readonly vehicleLabel: string;
  readonly rating: number;
  readonly comment: string;
  readonly adminReply: string | null;
  readonly repliedAt: string | null;
  readonly repliedByEmail: string | null;
  readonly isHidden: boolean;
  readonly createdAt: string;
}

export function fetchAdminReviews(params?: {
  page?: number;
  limit?: number;
  ratingMax?: number;
  isHidden?: boolean;
}): Promise<PaginatedResponse<AdminReviewDto>> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 20),
  });
  if (params?.ratingMax !== undefined) qs.set("ratingMax", String(params.ratingMax));
  if (params?.isHidden !== undefined) qs.set("isHidden", String(params.isHidden));
  return apiPaginated<AdminReviewDto>(`/admin/reviews?${qs.toString()}`);
}

export function replyAdminReview(
  id: string,
  adminReply: string
): Promise<AdminReviewDto> {
  return apiData<AdminReviewDto>(`/admin/reviews/${id}/reply`, {
    method: "POST",
    body: { adminReply },
  });
}

export function toggleAdminReviewHidden(
  id: string,
  isHidden: boolean
): Promise<AdminReviewDto> {
  return apiData<AdminReviewDto>(`/admin/reviews/${id}/hidden`, {
    method: "PATCH",
    body: { isHidden },
  });
}

