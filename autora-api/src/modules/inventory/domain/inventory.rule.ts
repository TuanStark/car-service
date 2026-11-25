import { BusinessRuleViolationException } from "@core/exceptions/domain.exception";

export type PurchaseOrderStatusValue =
  | "DRAFT"
  | "ORDERED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

const PO_TRANSITIONS: Record<
  PurchaseOrderStatusValue,
  readonly PurchaseOrderStatusValue[]
> = {
  DRAFT: ["ORDERED", "CANCELLED"],
  ORDERED: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
  PARTIALLY_RECEIVED: ["RECEIVED", "CANCELLED"],
  RECEIVED: [],
  CANCELLED: [],
};

/**
 * Weighted average unit cost calculation upon receiving stock from a PO.
 */
export function calculateWeightedAverageCost(params: {
  currentQty: number;
  currentAvgCostVnd: number;
  incomingQty: number;
  incomingUnitCostVnd: number;
}): number {
  if (params.incomingQty <= 0) return params.currentAvgCostVnd;
  const safeCurrentQty = Math.max(0, params.currentQty);
  const totalQty = safeCurrentQty + params.incomingQty;
  if (totalQty <= 0) return params.incomingUnitCostVnd;

  const totalValue =
    safeCurrentQty * params.currentAvgCostVnd +
    params.incomingQty * params.incomingUnitCostVnd;

  return Math.round(totalValue / totalQty);
}

/**
 * Prevents negative stock balances when issuing parts to a repair order or transferring.
 */
export function assertSufficientStock(params: {
  availableQty: number;
  requestedQty: number;
  partName: string;
}): void {
  if (params.requestedQty <= 0) {
    throw new BusinessRuleViolationException(
      "Số lượng xuất kho phải lớn hơn 0.",
      "INVALID_STOCK_QUANTITY"
    );
  }

  if (params.availableQty < params.requestedQty) {
    throw new BusinessRuleViolationException(
      `Tồn kho "${params.partName}" không đủ (khả dụng: ${params.availableQty}, yêu cầu: ${params.requestedQty}).`,
      "INSUFFICIENT_INVENTORY",
      {
        availableQty: params.availableQty,
        requestedQty: params.requestedQty,
      }
    );
  }
}

export function assertValidPoStatusTransition(params: {
  from: PurchaseOrderStatusValue;
  to: PurchaseOrderStatusValue;
}): void {
  if (params.from === params.to) return;
  const allowed = PO_TRANSITIONS[params.from] ?? [];
  if (!allowed.includes(params.to)) {
    throw new BusinessRuleViolationException(
      `Không thể chuyển trạng thái phiếu nhập từ ${params.from} sang ${params.to}.`,
      "INVALID_PO_STATUS_TRANSITION"
    );
  }
}

