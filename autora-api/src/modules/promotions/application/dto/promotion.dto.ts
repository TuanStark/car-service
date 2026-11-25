import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED_VND"] as const;

export class CouponQueryDto {
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
}

export class CreateCouponDto {
  @ApiProperty({ example: "AUTORA2026" })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: "Mã khuyến mãi chỉ gồm chữ in hoa, số, gạch dưới hoặc gạch ngang.",
  })
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  @MaxLength(255)
  description!: string;

  @ApiProperty({ enum: DISCOUNT_TYPES })
  @IsIn(DISCOUNT_TYPES)
  discountType!: (typeof DISCOUNT_TYPES)[number];

  @ApiProperty({ example: 15 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  discountValue!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  maxDiscountVnd?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minOrderVnd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiProperty()
  @IsDateString()
  startsAt!: string;

  @ApiProperty()
  @IsDateString()
  expiresAt!: string;
}

export class UpdateCouponDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[A-Z0-9_-]+$/)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  discountValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minOrderVnd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
