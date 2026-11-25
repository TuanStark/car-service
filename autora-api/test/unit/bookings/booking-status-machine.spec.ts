import { describe, expect, it } from "vitest";
import { BusinessRuleViolationException } from "@core/exceptions/domain.exception";
import {
  assertValidBookingStatusTransition,
  getAllowedNextBookingStatuses,
} from "@modules/bookings/domain/booking-status-machine";

describe("BookingStatusMachine", () => {
  it("exposes valid next statuses for each lifecycle state", () => {
    expect(getAllowedNextBookingStatuses("PENDING_CONFIRMATION")).toEqual([
      "CONFIRMED",
      "CHECKED_IN",
      "CANCELLED",
    ]);
    expect(getAllowedNextBookingStatuses("CONFIRMED")).toEqual([
      "CHECKED_IN",
      "IN_PROGRESS",
      "NO_SHOW",
      "CANCELLED",
    ]);
    expect(getAllowedNextBookingStatuses("CHECKED_IN")).toEqual([
      "IN_PROGRESS",
      "WAITING_APPROVAL",
      "CANCELLED",
    ]);
    expect(getAllowedNextBookingStatuses("IN_PROGRESS")).toEqual([
      "WAITING_APPROVAL",
      "QC_PENDING",
      "COMPLETED",
      "CANCELLED",
    ]);
    expect(getAllowedNextBookingStatuses("COMPLETED")).toEqual([]);
    expect(getAllowedNextBookingStatuses("CANCELLED")).toEqual([]);
    expect(getAllowedNextBookingStatuses("NO_SHOW")).toEqual([]);
  });

  it("allows valid forward transitions", () => {
    expect(() =>
      assertValidBookingStatusTransition({
        from: "PENDING_CONFIRMATION",
        to: "CONFIRMED",
      })
    ).not.toThrow();

    expect(() =>
      assertValidBookingStatusTransition({
        from: "IN_PROGRESS",
        to: "COMPLETED",
      })
    ).not.toThrow();
  });

  it("rejects terminal state transitions and skipping states", () => {
    expect(() =>
      assertValidBookingStatusTransition({
        from: "COMPLETED",
        to: "CANCELLED",
        reason: "Test",
      })
    ).toThrowError(BusinessRuleViolationException);

    expect(() =>
      assertValidBookingStatusTransition({
        from: "PENDING_CONFIRMATION",
        to: "COMPLETED",
      })
    ).toThrowError(BusinessRuleViolationException);

    expect(() =>
      assertValidBookingStatusTransition({
        from: "CANCELLED",
        to: "CONFIRMED",
      })
    ).toThrowError(BusinessRuleViolationException);
  });

  it("requires non-empty reason when transitioning to CANCELLED", () => {
    expect(() =>
      assertValidBookingStatusTransition({
        from: "CONFIRMED",
        to: "CANCELLED",
        reason: "   ",
      })
    ).toThrowError(BusinessRuleViolationException);

    expect(() =>
      assertValidBookingStatusTransition({
        from: "CONFIRMED",
        to: "CANCELLED",
        reason: "Khách đổi lịch sang tuần sau",
      })
    ).not.toThrow();
  });
});

