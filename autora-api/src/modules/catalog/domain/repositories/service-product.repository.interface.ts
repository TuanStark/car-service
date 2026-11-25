import type {
  PaginatedResult,
  PaginationParams,
} from "@core/domain/repository.interface";
import type {
  ServiceBadgeType,
  ServiceProductEntity,
  ServiceSpecification,
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

export interface AdminServiceFilterCriteria extends PaginationParams {
  readonly query?: string;
  readonly categoryId?: string;
  readonly isActive?: boolean;
}

export interface ServiceCategoryOptionDto {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly shortLabel: string;
}

export interface CreateServiceRecordInput {
  readonly id: string;
  readonly sku: string;
  readonly slug: string;
  readonly categoryId: string;
  readonly name: string;
  readonly shortSummary: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly galleryUrls: readonly string[];
  readonly priceVnd: number;
  readonly originalPriceVnd: number | null;
  readonly discountPercent: number | null;
  readonly badge: ServiceBadgeType;
  readonly estimatedDuration: string;
  readonly warrantyLabel: string;
  readonly compatibleVehicles: readonly VehicleBodyEnum[];
  readonly compatibleBrandsLabel: string;
  readonly includedSteps: readonly string[];
  readonly specifications: readonly ServiceSpecification[];
  readonly isFeatured: boolean;
  readonly isActive: boolean;
}

export interface UpdateServiceRecordInput {
  readonly sku?: string;
  readonly slug?: string;
  readonly categoryId?: string;
  readonly name?: string;
  readonly shortSummary?: string;
  readonly description?: string;
  readonly imageUrl?: string;
  readonly priceVnd?: number;
  readonly originalPriceVnd?: number | null;
  readonly discountPercent?: number | null;
  readonly badge?: ServiceBadgeType;
  readonly estimatedDuration?: string;
  readonly warrantyLabel?: string;
  readonly compatibleVehicles?: readonly VehicleBodyEnum[];
  readonly compatibleBrandsLabel?: string;
  readonly includedSteps?: readonly string[];
  readonly specifications?: readonly ServiceSpecification[];
  readonly isFeatured?: boolean;
}

export interface IServiceProductRepository {
  findMany(
    criteria: CatalogFilterCriteria
  ): Promise<PaginatedResult<ServiceProductEntity>>;
  findBySlug(slug: string): Promise<ServiceProductEntity | null>;
  findManyAdmin(
    criteria: AdminServiceFilterCriteria
  ): Promise<PaginatedResult<ServiceProductEntity>>;
  findById(id: string): Promise<ServiceProductEntity | null>;
  listCategories(): Promise<readonly ServiceCategoryOptionDto[]>;
  categoryExists(categoryId: string): Promise<boolean>;
  create(input: CreateServiceRecordInput): Promise<ServiceProductEntity>;
  update(
    id: string,
    input: UpdateServiceRecordInput
  ): Promise<ServiceProductEntity | null>;
  setActive(id: string, isActive: boolean): Promise<ServiceProductEntity | null>;
}
