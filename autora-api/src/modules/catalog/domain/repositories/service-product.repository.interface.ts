import type {
  PaginatedResult,
  PaginationParams,
} from "@core/domain/repository.interface";
import type {
  ServiceProductEntity,
  VehicleBodyEnum,
} from "../entities/service-product.entity";

export const SERVICE_PRODUCT_REPOSITORY = Symbol("SERVICE_PRODUCT_REPOSITORY");

export type CatalogSortBy =
  | "popular"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "discount";

export type PriceRangeFilter =
  | "all"
  | "under-500k"
  | "500k-1500k"
  | "over-1500k";

export interface CatalogFilterCriteria extends PaginationParams {
  readonly query?: string;
  readonly categoryCode?: string;
  readonly priceRange?: PriceRangeFilter;
  readonly vehicleType?: VehicleBodyEnum;
  readonly onlyDiscounted?: boolean;
  readonly sortBy?: CatalogSortBy;
}

export interface IServiceProductRepository {
  findMany(criteria: CatalogFilterCriteria): Promise<PaginatedResult<ServiceProductEntity>>;
  findBySlug(slug: string): Promise<ServiceProductEntity | null>;
}
