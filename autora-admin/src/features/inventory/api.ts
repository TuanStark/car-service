import {
  apiData,
  apiPaginated,
  type PaginatedResponse,
} from "@/infrastructure/api/api-client";

export type PartCategory =
  | "OIL_FLUID"
  | "FILTER"
  | "BRAKE_SUSPENSION"
  | "TIRE_BATTERY"
  | "DETAILING_CHEM"
  | "CONSUMABLE"
  | "OTHER";

export type StockMovementType =
  | "IN_PO"
  | "OUT_WORK_ORDER"
  | "RETURN_WORK_ORDER"
  | "ADJUST_IN"
  | "ADJUST_OUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

export interface PartItemDto {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly category: PartCategory;
  readonly unit: string;
  readonly brand: string | null;
  readonly avgCostVnd: number;
  readonly sellPriceVnd: number;
  readonly minStockThreshold: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface GarageInventoryRow {
  readonly id: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly partItemId: string;
  readonly sku: string;
  readonly partName: string;
  readonly category: PartCategory;
  readonly unit: string;
  readonly brand: string | null;
  readonly onHandQty: number;
  readonly reservedQty: number;
  readonly availableQty: number;
  readonly minStockThreshold: number;
  readonly isLowStock: boolean;
  readonly avgCostVnd: number;
  readonly sellPriceVnd: number;
  readonly inventoryValueVnd: number;
  readonly binLocation: string | null;
  readonly updatedAt: string;
}

export interface StockMovementRow {
  readonly id: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly partItemId: string;
  readonly sku: string;
  readonly partName: string;
  readonly unit: string;
  readonly type: StockMovementType;
  readonly qtyDelta: number;
  readonly unitCostVnd: number;
  readonly referenceType: string | null;
  readonly referenceId: string | null;
  readonly reason: string | null;
  readonly createdByEmail: string | null;
  readonly createdAt: string;
}

export function fetchAdminParts(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: PartCategory;
}): Promise<PaginatedResponse<PartItemDto>> {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 50),
  });
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.category) qs.set("category", params.category);
  return apiPaginated<PartItemDto>(`/admin/parts?${qs.toString()}`);
}

export function createAdminPart(payload: {
  sku: string;
  name: string;
  category: PartCategory;
  unit: string;
  brand?: string;
  avgCostVnd: number;
  sellPriceVnd: number;
  minStockThreshold: number;
}): Promise<PartItemDto> {
  return apiData<PartItemDto>("/admin/parts", {
    method: "POST",
    body: payload,
  });
}

export function fetchGarageInventory(params: {
  page?: number;
  limit?: number;
  garageId?: string;
  search?: string;
  lowStockOnly?: boolean;
}): Promise<PaginatedResponse<GarageInventoryRow>> {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 30),
  });
  if (params.garageId) qs.set("garageId", params.garageId);
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.lowStockOnly) qs.set("lowStockOnly", "true");
  return apiPaginated<GarageInventoryRow>(`/admin/inventory?${qs.toString()}`);
}

export function adjustGarageInventory(payload: {
  garageId: string;
  partItemId: string;
  qtyDelta: number;
  reason: string;
  binLocation?: string;
}): Promise<GarageInventoryRow> {
  return apiData<GarageInventoryRow>("/admin/inventory/adjust", {
    method: "POST",
    body: payload,
  });
}

export function transferGarageInventory(payload: {
  fromGarageId: string;
  toGarageId: string;
  partItemId: string;
  qty: number;
  reason?: string;
}): Promise<{ transferredQty: number }> {
  return apiData<{ transferredQty: number }>("/admin/inventory/transfer", {
    method: "POST",
    body: payload,
  });
}

export function fetchStockMovements(params: {
  page?: number;
  limit?: number;
  garageId?: string;
  type?: StockMovementType;
}): Promise<PaginatedResponse<StockMovementRow>> {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 30),
  });
  if (params.garageId) qs.set("garageId", params.garageId);
  if (params.type) qs.set("type", params.type);
  return apiPaginated<StockMovementRow>(`/admin/inventory/movements?${qs.toString()}`);
}

