import { apiPaginated, type PaginatedResponse } from "@/infrastructure/api/api-client";

export interface AuditLogItem {
  readonly id: string;
  readonly correlationId: string | null;
  readonly actorUserId: string | null;
  readonly actorEmail: string | null;
  readonly eventName: string;
  readonly resourceType: string;
  readonly resourceId: string | null;
  readonly payloadJson: unknown;
  readonly createdAt: string;
}

export function fetchAdminAuditLogs(params: {
  readonly page: number;
  readonly limit: number;
  readonly eventName?: string;
  readonly resourceType?: string;
  readonly search?: string;
}): Promise<PaginatedResponse<AuditLogItem>> {
  const qs = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.eventName?.trim()) qs.set("eventName", params.eventName.trim());
  if (params.resourceType?.trim()) qs.set("resourceType", params.resourceType.trim());
  if (params.search?.trim()) qs.set("search", params.search.trim());
  return apiPaginated<AuditLogItem>(`/admin/audit-logs?${qs.toString()}`);
}

