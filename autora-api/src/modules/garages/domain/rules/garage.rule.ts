import { BusinessRuleViolationException } from "@core/exceptions/domain.exception";

export type GarageStatusValue = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type GarageCityCodeValue = "HCM" | "HN" | "DN";

export function assertValidGarageRules(params: {
  bayCount: number;
  startingPriceVnd: number;
  status?: GarageStatusValue;
  isFeatured?: boolean;
}): void {
  if (params.bayCount < 1 || params.bayCount > 100) {
    throw new BusinessRuleViolationException(
      "Số cầu nâng của garage phải nằm trong khoảng 1 đến 100.",
      "INVALID_GARAGE_BAY_COUNT"
    );
  }

  if (params.startingPriceVnd < 0) {
    throw new BusinessRuleViolationException(
      "Giá khởi điểm không được là số âm.",
      "INVALID_GARAGE_STARTING_PRICE"
    );
  }

  if (params.status === "SUSPENDED" && params.isFeatured) {
    throw new BusinessRuleViolationException(
      "Không thể đặt Garage đang bị đình chỉ ở trạng thái nổi bật.",
      "SUSPENDED_GARAGE_CANNOT_BE_FEATURED"
    );
  }
}

