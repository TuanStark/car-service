export type ServiceCategoryId =
  | "bao-duong-dinh-ky"
  | "sua-chua-o-to"
  | "cham-soc-detailing"
  | "lop-va-mam-xe"
  | "dien-va-dieu-hoa"
  | "dau-nhot-phu-tung";

export type VehicleBodyType = "all" | "sedan" | "suv" | "mpv" | "ev";

export type CatalogSortBy =
  | "popular"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "discount";

export interface ServiceCategory {
  readonly id: ServiceCategoryId;
  readonly number: string;
  readonly title: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly image: string;
  readonly startingPriceVnd: number;
  readonly packageCount: number;
  readonly estimatedDuration: string;
  readonly highlights: readonly string[];
}

export interface ServiceProduct {
  readonly id: string;
  readonly sku: string;
  readonly slug: string;
  readonly categoryId: ServiceCategoryId;
  readonly categoryLabel: string;
  readonly name: string;
  readonly shortSummary: string;
  readonly description: string;
  readonly image: string;
  readonly gallery: readonly string[];
  readonly priceVnd: number;
  readonly originalPriceVnd?: number;
  readonly discountPercent?: number;
  readonly badge?: "BÁN CHẠY" | "ƯU ĐÃI" | "MỚI" | "KHUYÊN DÙNG";
  readonly rating: number;
  readonly reviewCount: number;
  readonly bookedCount: number;
  readonly estimatedDuration: string;
  readonly warrantyLabel: string;
  readonly compatibleVehicles: readonly VehicleBodyType[];
  readonly compatibleBrandsLabel: string;
  readonly includedSteps: readonly string[];
  readonly specifications: readonly { label: string; value: string }[];
  readonly supportedGarageIds: readonly string[];
  readonly isFeatured?: boolean;
}

export interface MaintenanceCombo {
  readonly id: string;
  readonly code: string;
  readonly milestoneLabel: string;
  readonly title: string;
  readonly subtitle: string;
  readonly priceVnd: number;
  readonly originalPriceVnd: number;
  readonly duration: string;
  readonly items: readonly string[];
  readonly linkedProductSlug: string;
  readonly recommended?: boolean;
}

export interface CatalogFilterParams {
  readonly query?: string;
  readonly categoryId?: ServiceCategoryId | "all";
  readonly priceRange?: "all" | "under-500k" | "500k-1500k" | "over-1500k";
  readonly vehicleType?: VehicleBodyType;
  readonly onlyDiscounted?: boolean;
  readonly sortBy?: CatalogSortBy;
}
