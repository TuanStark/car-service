import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  NotEquals,
} from "class-validator";

const PART_CATEGORIES = [
  "OIL_FLUID",
  "FILTER",
  "BRAKE",
  "TIRE",
  "BATTERY",
  "DETAILING_CHEM",
  "SPARE_PART",
] as const;

const MOVEMENT_TYPES = [
  "IN_PO",
  "OUT_WORK_ORDER",
  "RETURN_WORK_ORDER",
  "TRANSFER_OUT",
  "TRANSFER_IN",
  "ADJUSTMENT",
] as const;

export type PartCategoryValue = (typeof PART_CATEGORIES)[number];
export type StockMovementTypeValue = (typeof MOVEMENT_TYPES)[number];

export class PartQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PART_CATEGORIES })
  @IsOptional()
  @IsIn(PART_CATEGORIES)
  category?: PartCategoryValue;
}

export class CreatePartDto {
  @ApiProperty({ example: "PT-OIL-0W20" })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[A-Z0-9-]+$/)
  sku!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  oemCode?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: PART_CATEGORIES })
  @IsIn(PART_CATEGORIES)
  category!: PartCategoryValue;

  @ApiProperty({ example: "lít" })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  unit!: string;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStockQty?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  avgCostVnd?: number;

  @ApiProperty({ example: 220000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sellPriceVnd!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;
}

export class UpdatePartDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  oemCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: PART_CATEGORIES })
  @IsOptional()
  @IsIn(PART_CATEGORIES)
  category?: PartCategoryValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStockQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sellPriceVnd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class InventoryQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  garageId?: string;

  @ApiPropertyOptional({ enum: PART_CATEGORIES })
  @IsOptional()
  @IsIn(PART_CATEGORIES)
  category?: PartCategoryValue;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value
  )
  @IsBoolean()
  lowStock?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class AdjustInventoryDto {
  @ApiProperty()
  @IsUUID()
  garageId!: string;

  @ApiProperty()
  @IsUUID()
  partItemId!: string;

  @ApiProperty({ description: "Số lượng cộng (+) hoặc trừ (-)" })
  @Type(() => Number)
  @IsNumber()
  @NotEquals(0, { message: "Số lượng điều chỉnh phải khác 0." })
  qtyDelta!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  binLocation?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class TransferInventoryDto {
  @ApiProperty()
  @IsUUID()
  fromGarageId!: string;

  @ApiProperty()
  @IsUUID()
  toGarageId!: string;

  @ApiProperty()
  @IsUUID()
  partItemId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class MovementQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 25;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  garageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partItemId?: string;

  @ApiPropertyOptional({ enum: MOVEMENT_TYPES })
  @IsOptional()
  @IsIn(MOVEMENT_TYPES)
  type?: StockMovementTypeValue;
}

