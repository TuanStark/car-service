import { describe, expect, it } from "vitest";
import { BusinessRuleViolationException } from "@core/exceptions/domain.exception";
import {
  assertSufficientStock,
  assertValidPoStatusTransition,
  calculateWeightedAverageCost,
} from "../../../src/modules/inventory/domain/inventory.rule";

describe("Phase 2 Inventory & Procurement Rules", () => {
  it("computes weighted average cost accurately on PO receipt", () => {
    const avg = calculateWeightedAverageCost({
      currentQty: 10,
      currentAvgCostVnd: 100000,
      incomingQty: 10,
      incomingUnitCostVnd: 140000,
    });
    expect(avg).toBe(120000);
  });

  it("rejects issuing or transferring more than available stock", () => {
    expect(() =>
      assertSufficientStock({
        availableQty: 3,
        requestedQty: 4,
        partName: "Dầu nhớt 5W-30",
      })
    ).toThrow(BusinessRuleViolationException);
  });

  it("enforces valid PO status transitions", () => {
    expect(() =>
      assertValidPoStatusTransition({ from: "DRAFT", to: "ORDERED" })
    ).not.toThrow();

    expect(() =>
      assertValidPoStatusTransition({ from: "RECEIVED", to: "CANCELLED" })
    ).toThrow(BusinessRuleViolationException);
  });
});

