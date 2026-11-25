import {
  apiData,
  apiPaginated,
  type PaginatedResponse,
} from "@/infrastructure/api/api-client";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "ORDERED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export interface SupplierDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly phone: string | null;
  readonly email: string | null;
  readonly address: string | null;
  readonly paymentTerms: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface PurchaseOrderItemDto {
  readonly id: string;
  readonly partItemId: string;
  readonly sku: string;
  readonly partName: string;
  readonly unit: string;
  readonly orderedQty: number;
  readonly receivedQty: number;
  readonly unitCostVnd: number;
  readonly lineTotalVnd: number;
}

export interface PurchaseOrderDto {
  readonly id: string;
  readonly poCode: string;
  readonly supplierId: string;
  readonly supplierName: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly status: PurchaseOrderStatus;
  readonly totalCostVnd: number;
  readonly paidAmountVnd: number;
  readonly expectedDate: string | null;
  readonly receivedAt: string | null;
  readonly notes: string | null;
  readonly createdByEmail: string | null;
  readonly createdAt: string;
  readonly items: readonly PurchaseOrderItemDto[];
}

export function fetchSuppliers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResponse<SupplierDto>> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 50),
  });
  if (params?.search?.trim()) qs.set("search", params.search.trim());
  return apiPaginated<SupplierDto>(`/admin/suppliers?${qs.toString()}`);
}

export function createSupplier(payload: {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
}): Promise<SupplierDto> {
  return apiData<SupplierDto>("/admin/suppliers", {
    method: "POST",
    body: payload,
  });
}

export function fetchPurchaseOrders(params?: {
  page?: number;
  limit?: number;
  garageId?: string;
  status?: PurchaseOrderStatus;
}): Promise<PaginatedResponse<PurchaseOrderDto>> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 20),
  });
  if (params?.garageId) qs.set("garageId", params.garageId);
  if (params?.status) qs.set("status", params.status);
  return apiPaginated<PurchaseOrderDto>(`/admin/purchase-orders?${qs.toString()}`);
}

export function createPurchaseOrder(payload: {
  supplierId: string;
  garageId: string;
  expectedDate?: string;
  notes?: string;
  items: readonly {
    partItemId: string;
    orderedQty: number;
    unitCostVnd: number;
  }[];
}): Promise<PurchaseOrderDto> {
  return apiData<PurchaseOrderDto>("/admin/purchase-orders", {
    method: "POST",
    body: payload,
  });
}

export function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus
): Promise<PurchaseOrderDto> {
  return apiData<PurchaseOrderDto>(`/admin/purchase-orders/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export function receivePurchaseOrder(
  id: string,
  items: readonly { purchaseOrderItemId: string; receivedQty: number }[]
): Promise<PurchaseOrderDto> {
  return apiData<PurchaseOrderDto>(`/admin/purchase-orders/${id}/receive`, {
    method: "POST",
    body: { items },
  });
}

