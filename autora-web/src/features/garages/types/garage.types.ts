import type { ServiceCategoryId } from "@/features/catalog/types/service.types";

export type CityCode = "all" | "hcm" | "hn" | "dn";

export interface CityOption {
  readonly code: CityCode;
  readonly label: string;
}

export interface GarageServicePrice {
  readonly name: string;
  readonly priceVnd: number;
}

export interface GarageReview {
  readonly author: string;
  readonly vehicle: string;
  readonly rating: number;
  readonly date: string; // DD/MM/YYYY
  readonly comment: string;
}

export interface GarageEntity {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly district: string;
  readonly cityCode: Exclude<CityCode, "all">;
  readonly cityLabel: string;
  readonly fullAddress: string;
  readonly rating: number;
  readonly reviewCount: number;
  readonly verified: boolean;
  readonly isFeatured?: boolean;
  readonly coverImage: string;
  readonly openHours: string;
  readonly bayCount: number;
  readonly startingPriceVnd: number;
  readonly categories: readonly ServiceCategoryId[];
  readonly availableServices: readonly string[];
  readonly referencePrices: readonly GarageServicePrice[];
  readonly certifications: readonly string[];
  readonly summary: string;
  readonly latestReview: GarageReview;
}

export interface GarageFilterCriteria {
  readonly query: string;
  readonly city: CityCode;
  readonly category: ServiceCategoryId | "all";
}

