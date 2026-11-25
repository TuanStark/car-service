import { describe, expect, it } from "vitest";
import { calculateWorkshopPnl } from "@modules/reports/domain/pnl.rule";

describe("Workshop P&L Formula", () => {
  it("computes gross profit, platform fee, net profit and margin accurately", () => {
    const res = calculateWorkshopPnl({
      paidRevenueVnd: 100_000_000,
      cogsVnd: 35_000_000,
      technicianCommissionVnd: 10_000_000,
      warrantyInternalCostVnd: 2_000_000,
      platformFeeBps: 1000, // 10%
      operatingExpensesVnd: 20_000_000,
    });

    expect(res.grossProfitVnd).toBe(53_000_000);
    expect(res.platformFeeVnd).toBe(10_000_000);
    expect(res.netProfitVnd).toBe(23_000_000);
    expect(res.grossMarginPct).toBe(53);
  });

  it("returns 0 grossMarginPct when paidRevenueVnd is 0", () => {
    const res = calculateWorkshopPnl({
      paidRevenueVnd: 0,
      cogsVnd: 0,
      technicianCommissionVnd: 0,
      warrantyInternalCostVnd: 0,
      platformFeeBps: 1000,
      operatingExpensesVnd: 5_000_000,
    });

    expect(res.grossMarginPct).toBe(0);
    expect(res.netProfitVnd).toBe(-5_000_000);
  });
});

