import { BusinessRuleViolationException } from "@core/exceptions/domain.exception";

export const STANDARD_TIME_SLOTS = [
  "08:00",
  "09:30",
  "11:00",
  "13:30",
  "15:00",
  "16:30",
] as const;

export function assertSlotCapacityAvailable(params: {
  activeBookingsInSlot: number;
  bayCount: number;
  bayStatus?: string | null;
  bayOccupiedInSlot?: boolean;
  allowOverbook?: boolean;
}): void {
  if (params.bayStatus === "MAINTENANCE") {
    throw new BusinessRuleViolationException(
      "Cầu nâng đang bảo trì, không thể gán lịch hẹn.",
      "SERVICE_BAY_IN_MAINTENANCE"
    );
  }

  if (params.bayOccupiedInSlot) {
    throw new BusinessRuleViolationException(
      "Cầu nâng này đã có lịch hẹn khác trong cùng khung giờ.",
      "SERVICE_BAY_OCCUPIED"
    );
  }

  if (!params.allowOverbook && params.activeBookingsInSlot >= params.bayCount) {
    throw new BusinessRuleViolationException(
      `Khung giờ đã đạt tối đa ${params.bayCount}/${params.bayCount} cầu nâng tại xưởng.`,
      "GARAGE_SLOT_FULL",
      {
        activeBookingsInSlot: params.activeBookingsInSlot,
        bayCount: params.bayCount,
      }
    );
  }
}

