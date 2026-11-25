import { BusinessRuleViolationException } from "@core/exceptions/domain.exception";

export type BookingStatusValue =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

const ALLOWED_TRANSITIONS: Record<BookingStatusValue, readonly BookingStatusValue[]> = {
  PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const STATUS_LABELS_VI: Record<BookingStatusValue, string> = {
  PENDING_CONFIRMATION: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

export function getAllowedNextBookingStatuses(
  current: BookingStatusValue
): readonly BookingStatusValue[] {
  return ALLOWED_TRANSITIONS[current] ?? [];
}

export function assertValidBookingStatusTransition(params: {
  from: BookingStatusValue;
  to: BookingStatusValue;
  reason?: string;
}): void {
  if (params.from === params.to) {
    throw new BusinessRuleViolationException(
      `Lịch hẹn đang ở trạng thái "${STATUS_LABELS_VI[params.from]}".`,
      "BOOKING_SAME_STATUS"
    );
  }

  const allowed = ALLOWED_TRANSITIONS[params.from] ?? [];
  if (!allowed.includes(params.to)) {
    throw new BusinessRuleViolationException(
      `Không thể chuyển trạng thái từ "${STATUS_LABELS_VI[params.from]}" sang "${STATUS_LABELS_VI[params.to]}".`,
      "INVALID_BOOKING_STATUS_TRANSITION",
      { from: params.from, to: params.to, allowed }
    );
  }

  if (params.to === "CANCELLED" && (!params.reason || !params.reason.trim())) {
    throw new BusinessRuleViolationException(
      "Vui lòng nhập lý do khi hủy lịch hẹn.",
      "BOOKING_CANCEL_REASON_REQUIRED"
    );
  }
}

