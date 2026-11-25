import { BusinessRuleViolationException } from "@core/exceptions/domain.exception";

export type BookingStatusValue =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "WAITING_APPROVAL"
  | "QC_PENDING"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

const ALLOWED_TRANSITIONS: Record<BookingStatusValue, readonly BookingStatusValue[]> = {
  PENDING_CONFIRMATION: ["CONFIRMED", "CHECKED_IN", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "IN_PROGRESS", "NO_SHOW", "CANCELLED"],
  CHECKED_IN: ["IN_PROGRESS", "WAITING_APPROVAL", "CANCELLED"],
  IN_PROGRESS: ["WAITING_APPROVAL", "QC_PENDING", "COMPLETED", "CANCELLED"],
  WAITING_APPROVAL: ["IN_PROGRESS", "CANCELLED"],
  QC_PENDING: ["READY_FOR_PICKUP", "IN_PROGRESS", "COMPLETED"],
  READY_FOR_PICKUP: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const STATUS_LABELS_VI: Record<BookingStatusValue, string> = {
  PENDING_CONFIRMATION: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đã tiếp nhận xe",
  IN_PROGRESS: "Đang thực hiện",
  WAITING_APPROVAL: "Chờ khách duyệt phát sinh",
  QC_PENDING: "Đang kiểm tra QC",
  READY_FOR_PICKUP: "Sẵn sàng giao xe",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Khách không đến",
};

export const TERMINAL_BOOKING_STATUSES: readonly BookingStatusValue[] = [
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

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

  if (
    (params.to === "CANCELLED" || params.to === "NO_SHOW") &&
    (!params.reason || !params.reason.trim())
  ) {
    throw new BusinessRuleViolationException(
      "Vui lòng nhập lý do khi hủy hoặc đánh dấu khách không đến.",
      "BOOKING_CANCEL_REASON_REQUIRED"
    );
  }
}
