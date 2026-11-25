import { describe, expect, it } from "vitest";
import { BusinessRuleViolationException } from "@core/exceptions/domain.exception";
import { assertSlotCapacityAvailable } from "../../../src/modules/bookings/domain/booking-capacity.rule";
import { assertValidPaymentAction } from "../../../src/modules/bookings/domain/booking-payment-machine";

describe("Phase 1 Booking Domain Rules", () => {
  it("allows UNPAID -> CAPTURE -> PAID and PAID -> REFUND -> REFUNDED", () => {
    expect(
      assertValidPaymentAction({
        currentStatus: "UNPAID",
        action: "CAPTURE",
      })
    ).toBe("PAID");

    expect(
      assertValidPaymentAction({
        currentStatus: "PAID",
        action: "REFUND",
        reason: "Khách hủy do chờ phụ tùng",
      })
    ).toBe("REFUNDED");
  });

  it("blocks CAPTURE when already PAID and REFUND without reason", () => {
    expect(() =>
      assertValidPaymentAction({ currentStatus: "PAID", action: "CAPTURE" })
    ).toThrow(BusinessRuleViolationException);

    expect(() =>
      assertValidPaymentAction({ currentStatus: "PAID", action: "REFUND" })
    ).toThrow(BusinessRuleViolationException);
  });

  it("blocks overbooking and maintenance bays unless allowOverbook is set", () => {
    expect(() =>
      assertSlotCapacityAvailable({
        activeBookingsInSlot: 4,
        bayCount: 4,
      })
    ).toThrow(BusinessRuleViolationException);

    expect(() =>
      assertSlotCapacityAvailable({
        activeBookingsInSlot: 1,
        bayCount: 4,
        bayStatus: "MAINTENANCE",
      })
    ).toThrow(BusinessRuleViolationException);

    expect(() =>
      assertSlotCapacityAvailable({
        activeBookingsInSlot: 4,
        bayCount: 4,
        allowOverbook: true,
      })
    ).not.toThrow();
  });
});

