import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import type { VehicleBodyEnum } from "../../domain/entities/service-product.entity";
import type {
  CatalogSortBy,
  PriceRangeFilter,
} from "../../domain/repositories/service-product.repository.interface";

export class CatalogQueryDto {
  @ApiPropertyOptional({ example: "thay dau" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ example: "bao-duong-dinh-ky" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ enum: ["all", "under-500k", "500k-1500k", "over-1500k"] })
  @IsOptional()
  @IsIn(["all", "under-500k", "500k-1500k", "over-1500k"])
  priceRange?: PriceRangeFilter;

  @ApiPropertyOptional({ enum: ["ALL", "SEDAN", "SUV", "MPV", "EV"] })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value
  )
  @IsIn(["ALL", "SEDAN", "SUV", "MPV", "EV"])
  vehicleType?: VehicleBodyEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  onlyDiscounted?: boolean;

  @ApiPropertyOptional({ enum: ["popular", "price-asc", "price-desc", "rating", "discount"] })
  @IsOptional()
  @IsIn(["popular", "price-asc", "price-desc", "rating", "discount"])
  sortBy?: CatalogSortBy = "popular";

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}
