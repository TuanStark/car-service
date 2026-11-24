import { normalizeVietnameseText } from "@/core/lib/vietnamese";
import {
  MAINTENANCE_COMBOS_MOCK,
  SERVICE_CATEGORIES_MOCK,
  SERVICE_PRODUCTS_MOCK,
} from "../data/services.mock";
import type {
  CatalogFilterParams,
  MaintenanceCombo,
  ServiceCategory,
  ServiceCategoryId,
  ServiceProduct,
} from "../types/service.types";

export const catalogService = {
  getAllCategories(): readonly ServiceCategory[] {
    return SERVICE_CATEGORIES_MOCK;
  },

  getCategoryById(id: ServiceCategoryId): ServiceCategory | undefined {
    return SERVICE_CATEGORIES_MOCK.find((category) => category.id === id);
  },

  getAllProducts(): readonly ServiceProduct[] {
    return SERVICE_PRODUCTS_MOCK;
  },

  getFeaturedProducts(limit = 8): readonly ServiceProduct[] {
    return SERVICE_PRODUCTS_MOCK.filter((p) => p.isFeatured).slice(0, limit);
  },

  getProductBySlug(slug: string): ServiceProduct | undefined {
    return SERVICE_PRODUCTS_MOCK.find((p) => p.slug === slug);
  },

  getProductsByGarageId(garageId: string): readonly ServiceProduct[] {
    return SERVICE_PRODUCTS_MOCK.filter((p) =>
      p.supportedGarageIds.includes(garageId)
    );
  },

  getRelatedProducts(
    currentProduct: ServiceProduct,
    limit = 4
  ): readonly ServiceProduct[] {
    const sameCategory = SERVICE_PRODUCTS_MOCK.filter(
      (p) =>
        p.id !== currentProduct.id && p.categoryId === currentProduct.categoryId
    );
    const others = SERVICE_PRODUCTS_MOCK.filter(
      (p) =>
        p.id !== currentProduct.id && p.categoryId !== currentProduct.categoryId
    );
    return [...sameCategory, ...others].slice(0, limit);
  },

  filterProducts(params: CatalogFilterParams): readonly ServiceProduct[] {
    const normalizedQuery = normalizeVietnameseText(params.query ?? "");
    const categoryId = params.categoryId ?? "all";
    const priceRange = params.priceRange ?? "all";
    const vehicleType = params.vehicleType ?? "all";
    const sortBy = params.sortBy ?? "popular";

    const filtered = SERVICE_PRODUCTS_MOCK.filter((product) => {
      if (categoryId !== "all" && product.categoryId !== categoryId) {
        return false;
      }

      if (params.onlyDiscounted && !product.discountPercent) {
        return false;
      }

      if (
        vehicleType !== "all" &&
        !product.compatibleVehicles.includes(vehicleType)
      ) {
        return false;
      }

      if (priceRange === "under-500k" && product.priceVnd >= 500000) {
        return false;
      }
      if (
        priceRange === "500k-1500k" &&
        (product.priceVnd < 500000 || product.priceVnd > 1500000)
      ) {
        return false;
      }
      if (priceRange === "over-1500k" && product.priceVnd <= 1500000) {
        return false;
      }

      if (normalizedQuery.length > 0) {
        const corpus = normalizeVietnameseText(
          [
            product.sku,
            product.name,
            product.categoryLabel,
            product.shortSummary,
            product.compatibleBrandsLabel,
          ].join(" ")
        );
        if (!corpus.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.priceVnd - b.priceVnd;
        case "price-desc":
          return b.priceVnd - a.priceVnd;
        case "rating":
          return b.rating - a.rating || b.reviewCount - a.reviewCount;
        case "discount":
          return (b.discountPercent ?? 0) - (a.discountPercent ?? 0);
        case "popular":
        default:
          return b.bookedCount - a.bookedCount;
      }
    });
  },

  getMaintenanceCombos(): readonly MaintenanceCombo[] {
    return MAINTENANCE_COMBOS_MOCK;
  },
};
