import type { PaginatedResult } from "@core/domain/repository.interface";
import type {
  GarageCityCodeValue,
  GarageStatusValue,
} from "../rules/garage.rule";

export interface GarageListFilterCriteria {
  readonly page: number;
  readonly limit: number;
  readonly search?: string;
  readonly cityCode?: GarageCityCodeValue;
  readonly status?: GarageStatusValue;
  readonly verified?: boolean;
}

export interface GarageListItemDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly district: string;
  readonly cityCode: GarageCityCodeValue;
  readonly cityLabel: string;
  readonly fullAddress: string;
  readonly phone: string | null;
  readonly ratingAvg: number;
  readonly reviewCount: number;
  readonly verified: boolean;
  readonly status: GarageStatusValue;
  readonly isFeatured: boolean;
  readonly bayCount: number;
  readonly startingPriceVnd: number;
  readonly openHours: string;
  readonly serviceCount: number;
  readonly bookingCount: number;
  readonly updatedAt: string;
}

export interface GarageDetailDto extends GarageListItemDto {
  readonly coverImageUrl: string;
  readonly certifications: readonly string[];
  readonly summary: string;
  readonly createdAt: string;
  readonly offeredServices: readonly {
    readonly serviceProductId: string;
    readonly sku: string;
    readonly name: string;
    readonly categoryTitle: string;
    readonly basePriceVnd: number;
    readonly customPriceVnd: number | null;
    readonly isAvailable: boolean;
  }[];
  readonly recentBookings: readonly {
    readonly id: string;
    readonly orderCode: string;
    readonly customerName: string;
    readonly appointmentDate: string;
    readonly appointmentTime: string;
    readonly status: string;
    readonly totalVnd: number;
  }[];
}

export interface CreateGarageRecordInput {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly district: string;
  readonly cityCode: GarageCityCodeValue;
  readonly cityLabel: string;
  readonly fullAddress: string;
  readonly phone?: string;
  readonly verified: boolean;
  readonly status: GarageStatusValue;
  readonly isFeatured: boolean;
  readonly coverImageUrl: string;
  readonly openHours: string;
  readonly bayCount: number;
  readonly startingPriceVnd: number;
  readonly certifications: readonly string[];
  readonly summary: string;
}

export interface UpdateGarageRecordInput {
  readonly name?: string;
  readonly district?: string;
  readonly cityCode?: GarageCityCodeValue;
  readonly cityLabel?: string;
  readonly fullAddress?: string;
  readonly phone?: string;
  readonly isFeatured?: boolean;
  readonly coverImageUrl?: string;
  readonly openHours?: string;
  readonly bayCount?: number;
  readonly startingPriceVnd?: number;
  readonly certifications?: readonly string[];
  readonly summary?: string;
}

export const GARAGE_REPOSITORY = Symbol("GARAGE_REPOSITORY");

export interface IGarageRepository {
  findManyAdmin(
    criteria: GarageListFilterCriteria
  ): Promise<PaginatedResult<GarageListItemDto>>;
  findDetailById(id: string): Promise<GarageDetailDto | null>;
  create(input: CreateGarageRecordInput): Promise<GarageDetailDto>;
  update(id: string, input: UpdateGarageRecordInput): Promise<GarageDetailDto | null>;
  updateStatus(
    id: string,
    input: { status?: GarageStatusValue; verified?: boolean }
  ): Promise<GarageDetailDto | null>;
}

