import { describe, expect, it } from "vitest";
import { BusinessRuleViolationException } from "@core/exceptions/domain.exception";
import { validateAndNormalizeServicePricing } from "@modules/catalog/domain/rules/service-pricing.rule";

describe("ServicePricingRule", () => {
  it("computes discount percentage from originalPriceVnd and priceVnd", () => {
    const result = validateAndNormalizeServicePricing({
      priceVnd: 450_000,
      originalPriceVnd: 550_000,
    });

    expect(result).toEqual({
      priceVnd: 450_000,
      originalPriceVnd: 550_000,
      discountPercent: 18,
    });
  });

  it("rejects originalPriceVnd lower than selling priceVnd", () => {
    expect(() =>
      validateAndNormalizeServicePricing({
        priceVnd: 600_000,
        originalPriceVnd: 500_000,
      })
    ).toThrowError(BusinessRuleViolationException);
  });

  it("rejects non-positive priceVnd", () => {
    expect(() =>
      validateAndNormalizeServicePricing({ priceVnd: 0 })
    ).toThrowError(BusinessRuleViolationException);
  });
});

