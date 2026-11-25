import { BusinessRuleViolationException } from "@core/exceptions/domain.exception";

export type EquipmentStatusValue =
  | "OPERATIONAL"
  | "IN_USE"
  | "MAINTENANCE"
  | "BROKEN";

export function assertToolAvailableForCheckout(params: {
  hasActiveCheckout: boolean;
  equipmentStatus: EquipmentStatusValue;
  equipmentName: string;
}): void {
  if (params.hasActiveCheckout || params.equipmentStatus === "IN_USE") {
    throw new BusinessRuleViolationException(
      `Dụng cụ "${params.equipmentName}" đang được kỹ thuật viên khác mượn và chưa trả.`,
      "TOOL_ALREADY_CHECKED_OUT"
    );
  }

  if (
    params.equipmentStatus === "MAINTENANCE" ||
    params.equipmentStatus === "BROKEN"
  ) {
    throw new BusinessRuleViolationException(
      `Thiết bị "${params.equipmentName}" đang bảo trì hoặc hư hỏng, không thể xuất mượn.`,
      "EQUIPMENT_UNAVAILABLE"
    );
  }
}

export function shouldLockLinkedBay(nextStatus: EquipmentStatusValue): boolean {
  return nextStatus === "MAINTENANCE" || nextStatus === "BROKEN";
}

export function isDueWithinDays(
  targetDate: Date | null | undefined,
  days: number,
  now: Date = new Date()
): boolean {
  if (!targetDate) return false;
  const horizonMs = now.getTime() + days * 86_400_000;
  return targetDate.getTime() <= horizonMs;
}

