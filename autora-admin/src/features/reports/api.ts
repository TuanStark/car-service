import {
  apiData,
  apiPaginated,
  type PaginatedResponse,
} from "@/infrastructure/api/api-client";

export type ExpenseCategory =
  | "RENT_UTILITIES"
  | "BASE_SALARY"
  | "SUPPLIER_PAYMENT"
  | "EQUIPMENT_MAINT"
  | "WASTE_DISPOSAL"
  | "MARKETING"
  | "OTHER";

export interface PnlMetrics {
  readonly paidRevenueVnd: number;
  readonly cogsVnd: number;
  readonly technicianCommissionVnd: number;
  readonly warrantyInternalCostVnd: number;
  readonly grossProfitVnd: number;
  readonly platformFeeVnd: number;
  readonly operatingExpensesVnd: number;
  readonly netProfitVnd: number;
  readonly grossMarginPct: number;
}

export interface GaragePnlRow extends PnlMetrics {
  readonly garageId: string;
  readonly garageName: string;
  readonly paidBookingCount: number;
}

export interface WorkshopPnlReportDto {
  readonly summary: PnlMetrics;
  readonly byGarage: readonly GaragePnlRow[];
  readonly cashbook: {
    readonly totalCashInVnd: number;
    readonly totalCashOutVnd: number;
    readonly netCashFlowVnd: number;
  };
}

export interface ExpenseEntryDto {
  readonly id: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly category: ExpenseCategory;
  readonly amountVnd: number;
  readonly occurredAt: string;
  readonly referenceCode: string | null;
  readonly description: string;
  readonly receiptUrl: string | null;
  readonly recordedByEmail: string | null;
  readonly createdAt: string;
}

export function fetchWorkshopPnl(params?: {
  garageId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<WorkshopPnlReportDto> {
  const qs = new URLSearchParams();
  if (params?.garageId) qs.set("garageId", params.garageId);
  if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params?.dateTo) qs.set("dateTo", params.dateTo);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiData<WorkshopPnlReportDto>(`/admin/reports/pnl${suffix}`);
}

export function fetchExpenses(params?: {
  page?: number;
  limit?: number;
  garageId?: string;
  category?: ExpenseCategory;
}): Promise<PaginatedResponse<ExpenseEntryDto>> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 25),
  });
  if (params?.garageId) qs.set("garageId", params.garageId);
  if (params?.category) qs.set("category", params.category);
  return apiPaginated<ExpenseEntryDto>(`/admin/reports/expenses?${qs.toString()}`);
}

export function createExpense(payload: {
  garageId: string;
  category: ExpenseCategory;
  amountVnd: number;
  occurredAt: string;
  referenceCode?: string;
  description: string;
  receiptUrl?: string;
}): Promise<ExpenseEntryDto> {
  return apiData<ExpenseEntryDto>("/admin/reports/expenses", {
    method: "POST",
    body: payload,
  });
}

export function deleteExpense(id: string): Promise<void> {
  return apiData<void>(`/admin/reports/expenses/${id}`, {
    method: "DELETE",
  });
}

