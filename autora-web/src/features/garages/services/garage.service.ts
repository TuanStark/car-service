import { normalizeVietnameseText } from "@/core/lib/vietnamese";
import { CITY_OPTIONS, GARAGES_MOCK } from "../data/garages.mock";
import type {
  CityOption,
  GarageEntity,
  GarageFilterCriteria,
} from "../types/garage.types";

export const garageService = {
  getCities(): readonly CityOption[] {
    return CITY_OPTIONS;
  },

  getAllGarages(): readonly GarageEntity[] {
    return GARAGES_MOCK;
  },

  getFeaturedGarage(): GarageEntity {
    return (
      GARAGES_MOCK.find((garage) => garage.isFeatured) ?? GARAGES_MOCK[0]
    );
  },

  getGarageBySlug(slug: string): GarageEntity | undefined {
    return GARAGES_MOCK.find((garage) => garage.slug === slug);
  },

  getGarageById(id: string): GarageEntity | undefined {
    return GARAGES_MOCK.find((garage) => garage.id === id);
  },

  filterGarages(criteria: GarageFilterCriteria): readonly GarageEntity[] {
    const normalizedQuery = normalizeVietnameseText(criteria.query);

    return GARAGES_MOCK.filter((garage) => {
      if (criteria.city !== "all" && garage.cityCode !== criteria.city) {
        return false;
      }

      if (
        criteria.category !== "all" &&
        !garage.categories.includes(criteria.category)
      ) {
        return false;
      }

      if (normalizedQuery.length > 0) {
        const searchableCorpus = normalizeVietnameseText(
          [
            garage.name,
            garage.district,
            garage.fullAddress,
            garage.cityLabel,
            ...garage.availableServices,
          ].join(" ")
        );

        if (!searchableCorpus.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    });
  },
};

