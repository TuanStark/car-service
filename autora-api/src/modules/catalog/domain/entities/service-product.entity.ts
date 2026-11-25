import { BaseEntity } from "@core/domain/entity.base";

export type ServiceBadgeType = "BEST_SELLER" | "PROMO" | "NEW" | "RECOMMENDED" | null;
export type VehicleBodyEnum = "ALL" | "SEDAN" | "SUV" | "MPV" | "EV";

export interface ServiceSpecification {
  readonly label: string;
  readonly value: string;
}

export interface ServiceProductProps {
  sku: string;
  slug: string;
  categoryId: string;
  categoryCode: string;
  categoryLabel: string;
  name: string;
  shortSummary: string;
  description: string;
  imageUrl: string;
  galleryUrls: readonly string[];
  priceVnd: number;
  originalPriceVnd: number | null;
  discountPercent: number | null;
  badge: ServiceBadgeType;
  ratingAvg: number;
  reviewCount: number;
  bookedCount: number;
  estimatedDuration: string;
  warrantyLabel: string;
  compatibleVehicles: readonly VehicleBodyEnum[];
  compatibleBrandsLabel: string;
  includedSteps: readonly string[];
  specifications: readonly ServiceSpecification[];
  isFeatured: boolean;
  isActive: boolean;
}

export class ServiceProductEntity extends BaseEntity<ServiceProductProps> {
  private constructor(id: string, props: ServiceProductProps) {
    super(id, props);
  }

  static reconstitute(id: string, props: ServiceProductProps): ServiceProductEntity {
    return new ServiceProductEntity(id, props);
  }

  toJSON(): { id: string } & ServiceProductProps {
    return {
      id: this.id,
      ...this.props,
    };
  }
}
