import {
  apiData,
  apiPaginated,
  type PaginatedResponse,
} from "@/infrastructure/api/api-client";

export type WarrantyStatus = "ACTIVE" | "CLAIMED" | "EXPIRED" | "VOIDED";
export type WarrantyRootCause =
  | "WORKMANSHIP"
  | "DEFECTIVE_PART"
  | "CUSTOMER_MISUSE"
  | "OTHER";
export type WarrantyClaimStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

export interface WarrantyClaimDto {
  readonly id: string;
  readonly issueDescription: string;
  readonly rootCause: WarrantyRootCause;
  readonly internalCostVnd: number;
  readonly resolution: string | null;
  readonly status: WarrantyClaimStatus;
  readonly handledByEmail: string | null;
  readonly createdAt: string;
}

export interface WarrantyRecordDto {
  readonly id: string;
  readonly warrantyCode: string;
  readonly bookingId: string;
  readonly bookingOrderCode: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly serviceNameSnap: string;
  readonly licensePlate: string;
  readonly customerName: string;
  readonly warrantyLabel: string;
  readonly startsAt: string;
  readonly validUntilDate: string;
  readonly startOdoKm: number;
  readonly validUntilOdoKm: number | null;
  readonly status: WarrantyStatus;
  readonly claims: readonly WarrantyClaimDto[];
}

export function fetchAdminWarranties(params?: {
  page?: number;
  limit?: number;
  status?: WarrantyStatus;
  search?: string;
}): Promise<PaginatedResponse<WarrantyRecordDto>> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 20),
  });
  if (params?.status) qs.set("status", params.status);
  if (params?.search?.trim()) qs.set("search", params.search.trim());
  return apiPaginated<WarrantyRecordDto>(`/admin/warranties?${qs.toString()}`);
}

export function createWarrantyClaim(
  warrantyId: string,
  payload: {
    issueDescription: string;
    rootCause: WarrantyRootCause;
    internalCostVnd?: number;
    resolution?: string;
  }
): Promise<WarrantyRecordDto> {
  return apiData<WarrantyRecordDto>(`/admin/warranties/${warrantyId}/claims`, {
    method: "POST",
    body: payload,
  });
}

export function updateWarrantyClaim(
  claimId: string,
  payload: {
    status?: WarrantyClaimStatus;
    internalCostVnd?: number;
    resolution?: string;
  }
): Promise<WarrantyClaimDto> {
  return apiData<WarrantyClaimDto>(`/admin/warranties/claims/${claimId}`, {
    method: "PATCH",
    body: payload,
  });
}

