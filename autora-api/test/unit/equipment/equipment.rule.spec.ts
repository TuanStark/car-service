import { describe, expect, it } from "vitest";
import { BusinessRuleViolationException } from "@core/exceptions/domain.exception";
import {
  assertToolAvailableForCheckout,
  isDueWithinDays,
  shouldLockLinkedBay,
} from "@modules/equipment/domain/equipment.rule";

describe("Equipment & Tool Domain Rules", () => {
  it("prevents two technicians from checking out the same tool simultaneously", () => {
    expect(() =>
      assertToolAvailableForCheckout({
        hasActiveCheckout: true,
        equipmentStatus: "IN_USE",
        equipmentName: "TL-TORQ-01",
      })
    ).toThrowError(BusinessRuleViolationException);
  });

  it("blocks checkout when equipment is under maintenance or broken", () => {
    expect(() =>
      assertToolAvailableForCheckout({
        hasActiveCheckout: false,
        equipmentStatus: "MAINTENANCE",
        equipmentName: "EQ-SCAN-01",
      })
    ).toThrowError(BusinessRuleViolationException);
  });

  it("locks linked service bay when equipment transitions to MAINTENANCE or BROKEN", () => {
    expect(shouldLockLinkedBay("MAINTENANCE")).toBe(true);
    expect(shouldLockLinkedBay("BROKEN")).toBe(true);
    expect(shouldLockLinkedBay("OPERATIONAL")).toBe(false);
  });

  it("flags calibration or maintenance due within 7 days", () => {
    const now = new Date("2026-11-25T00:00:00Z");
    expect(isDueWithinDays(new Date("2026-11-28T00:00:00Z"), 7, now)).toBe(true);
    expect(isDueWithinDays(new Date("2026-12-20T00:00:00Z"), 7, now)).toBe(false);
    expect(isDueWithinDays(null, 7, now)).toBe(false);
  });
});

