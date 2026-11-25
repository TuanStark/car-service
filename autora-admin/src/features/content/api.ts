import {
  apiData,
  apiPaginated,
  type PaginatedResponse,
} from "@/infrastructure/api/api-client";

export type ArticleStatus = "DRAFT" | "PUBLISHED";
export type ContactInquiryStatus = "NEW" | "CONTACTED" | "RESOLVED";

export interface ArticleDto {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly contentMarkdown: string;
  readonly coverImageUrl: string;
  readonly category: string;
  readonly status: ArticleStatus;
  readonly publishedAt: string | null;
  readonly authorEmail: string | null;
  readonly createdAt: string;
}

export interface ContactInquiryDto {
  readonly id: string;
  readonly fullName: string;
  readonly phone: string;
  readonly email: string | null;
  readonly vehicleInfo: string | null;
  readonly message: string;
  readonly status: ContactInquiryStatus;
  readonly staffNote: string | null;
  readonly assignedToEmail: string | null;
  readonly createdAt: string;
}

export function fetchAdminArticles(params?: {
  page?: number;
  limit?: number;
  status?: ArticleStatus;
}): Promise<PaginatedResponse<ArticleDto>> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 20),
  });
  if (params?.status) qs.set("status", params.status);
  return apiPaginated<ArticleDto>(`/admin/content/articles?${qs.toString()}`);
}

export function createAdminArticle(payload: {
  title: string;
  excerpt: string;
  contentMarkdown: string;
  coverImageUrl: string;
  category: string;
  status: ArticleStatus;
}): Promise<ArticleDto> {
  return apiData<ArticleDto>("/admin/content/articles", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminArticle(
  id: string,
  payload: { status?: ArticleStatus }
): Promise<ArticleDto> {
  return apiData<ArticleDto>(`/admin/content/articles/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteAdminArticle(id: string): Promise<void> {
  return apiData<void>(`/admin/content/articles/${id}`, {
    method: "DELETE",
  });
}

export function fetchAdminLeads(): Promise<ContactInquiryDto[]> {
  return apiData<ContactInquiryDto[]>("/admin/content/leads");
}

export function updateAdminLead(
  id: string,
  payload: { status?: ContactInquiryStatus; staffNote?: string }
): Promise<ContactInquiryDto> {
  return apiData<ContactInquiryDto>(`/admin/content/leads/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

