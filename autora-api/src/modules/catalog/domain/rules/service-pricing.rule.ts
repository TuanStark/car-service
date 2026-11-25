import { BusinessRuleViolationException } from "@core/exceptions/domain.exception";

const MAX_SERVICE_PRICE_VND = 500_000_000;

export interface ComputedPricingResult {
  readonly priceVnd: number;
  readonly originalPriceVnd: number | null;
  readonly discountPercent: number | null;
}

/**
 * Validates service pricing invariants and derives consistent discount percentages.
 */
export function validateAndNormalizeServicePricing(params: {
  priceVnd: number;
  originalPriceVnd?: number | null;
}): ComputedPricingResult {
  if (!Number.isInteger(params.priceVnd) || params.priceVnd <= 0) {
    throw new BusinessRuleViolationException(
      "Giá dịch vụ phải là số nguyên dương (VNĐ).",
      "INVALID_SERVICE_PRICE"
    );
  }

  if (params.priceVnd > MAX_SERVICE_PRICE_VND) {
    throw new BusinessRuleViolationException(
      "Giá dịch vụ không được vượt quá 500.000.000 VNĐ.",
      "SERVICE_PRICE_EXCEEDS_LIMIT"
    );
  }

  const orig = params.originalPriceVnd ?? null;
  if (orig === null) {
    return {
      priceVnd: params.priceVnd,
      originalPriceVnd: null,
      discountPercent: null,
    };
  }

  if (!Number.isInteger(orig) || orig < params.priceVnd) {
    throw new BusinessRuleViolationException(
      "Giá gốc niêm yết phải lớn hơn hoặc bằng giá bán hiện tại.",
      "INVALID_ORIGINAL_PRICE",
      { priceVnd: params.priceVnd, originalPriceVnd: orig }
    );
  }

  if (orig === params.priceVnd) {
    return {
      priceVnd: params.priceVnd,
      originalPriceVnd: orig,
      discountPercent: null,
    };
  }

  const discountPercent = Math.round(((orig - params.priceVnd) / orig) * 100);
  return {
    priceVnd: params.priceVnd,
    originalPriceVnd: orig,
    discountPercent: discountPercent > 0 ? discountPercent : null,
  };
}

