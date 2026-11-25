export interface PnlInput {
  readonly paidRevenueVnd: number;
  readonly cogsVnd: number;
  readonly technicianCommissionVnd: number;
  readonly warrantyInternalCostVnd: number;
  readonly platformFeeBps: number;
  readonly operatingExpensesVnd: number;
}

export interface PnlOutput {
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

export function calculateWorkshopPnl(input: PnlInput): PnlOutput {
  const grossProfitVnd =
    input.paidRevenueVnd -
    input.cogsVnd -
    input.technicianCommissionVnd -
    input.warrantyInternalCostVnd;

  const platformFeeVnd = Math.round(
    (input.paidRevenueVnd * input.platformFeeBps) / 10_000
  );

  const netProfitVnd =
    grossProfitVnd - platformFeeVnd - input.operatingExpensesVnd;

  const grossMarginPct =
    input.paidRevenueVnd > 0
      ? Number(((grossProfitVnd / input.paidRevenueVnd) * 100).toFixed(1))
      : 0;

  return {
    paidRevenueVnd: input.paidRevenueVnd,
    cogsVnd: input.cogsVnd,
    technicianCommissionVnd: input.technicianCommissionVnd,
    warrantyInternalCostVnd: input.warrantyInternalCostVnd,
    grossProfitVnd,
    platformFeeVnd,
    operatingExpensesVnd: input.operatingExpensesVnd,
    netProfitVnd,
    grossMarginPct,
  };
}

