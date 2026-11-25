import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";
import type {
  ServiceBadgeType,
  VehicleBodyEnum,
} from "../../domain/entities/service-product.entity";

const BADGE_VALUES = ["BEST_SELLER", "PROMO", "NEW", "RECOMMENDED"] as const;
const VEHICLE_VALUES: readonly VehicleBodyEnum[] = [
  "ALL",
  "SEDAN",
  "SUV",
  "MPV",
  "EV",
];

export class AdminServiceQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 15;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value
  )
  @IsBoolean()
  isActive?: boolean;
}

export class CreateServiceDto {
  @ApiProperty({ example: "ATR-BD-099" })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[A-Z0-9-]+$/, {
    message: "Mã SKU chỉ gồm chữ in hoa, số và dấu gạch ngang.",
  })
  sku!: string;

  @ApiProperty({ example: "thay-loc-gio-dong-co-chinh-hang" })
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  @Matches(/^[a-z0-9-]+$/, {
    message: "Slug chỉ gồm chữ thường, số và dấu gạch ngang.",
  })
  slug!: string;

  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  @MaxLength(220)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(400)
  shortSummary!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiPropertyOptional({ default: "/images/service-maintenance.jpg" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryUrls?: string[];

  @ApiProperty({ example: 450000 })
  @Type(() => Number)
  @IsInt()
  @Min(1000, { message: "Giá dịch vụ tối thiểu là 1.000 VNĐ." })
  priceVnd!: number;

  @ApiPropertyOptional({ example: 550000 })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  originalPriceVnd?: number | null;

  @ApiPropertyOptional({ enum: BADGE_VALUES, nullable: true })
  @IsOptional()
  @IsIn([...BADGE_VALUES, null])
  badge?: ServiceBadgeType;

  @ApiProperty({ example: "45 phút" })
  @IsString()
  @MaxLength(60)
  estimatedDuration!: string;

  @ApiProperty({ example: "Bảo hành 6 tháng / 10.000 km" })
  @IsString()
  @MaxLength(120)
  warrantyLabel!: string;

  @ApiPropertyOptional({ enum: VEHICLE_VALUES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(VEHICLE_VALUES, { each: true })
  compatibleVehicles?: VehicleBodyEnum[];

  @ApiPropertyOptional({ default: "Đa dòng xe du lịch 4-7 chỗ" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  compatibleBrandsLabel?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedSteps?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateServiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[A-Z0-9-]+$/)
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(220)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(400)
  shortSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  priceVnd?: number;

  @ApiPropertyOptional({ nullable: true })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  originalPriceVnd?: number | null;

  @ApiPropertyOptional({ enum: BADGE_VALUES, nullable: true })
  @IsOptional()
  badge?: ServiceBadgeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  estimatedDuration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  warrantyLabel?: string;

  @ApiPropertyOptional({ enum: VEHICLE_VALUES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(VEHICLE_VALUES, { each: true })
  compatibleVehicles?: VehicleBodyEnum[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  compatibleBrandsLabel?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedSteps?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class ToggleServiceStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}

