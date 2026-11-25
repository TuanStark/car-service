import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
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
import type {
  GarageCityCodeValue,
  GarageStatusValue,
} from "../../domain/rules/garage.rule";

const CITY_CODES: readonly GarageCityCodeValue[] = ["HCM", "HN", "DN"];
const GARAGE_STATUSES: readonly GarageStatusValue[] = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
];

export class AdminGarageQueryDto {
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
  search?: string;

  @ApiPropertyOptional({ enum: CITY_CODES })
  @IsOptional()
  @IsIn(CITY_CODES)
  cityCode?: GarageCityCodeValue;

  @ApiPropertyOptional({ enum: GARAGE_STATUSES })
  @IsOptional()
  @IsIn(GARAGE_STATUSES)
  status?: GarageStatusValue;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value
  )
  @IsBoolean()
  verified?: boolean;
}

export class CreateGarageDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  @Matches(/^[a-z0-9-]+$/, {
    message: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang.",
  })
  slug!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  district!: string;

  @ApiProperty({ enum: CITY_CODES })
  @IsIn(CITY_CODES)
  cityCode!: GarageCityCodeValue;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  cityLabel!: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(350)
  fullAddress!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ enum: GARAGE_STATUSES, default: "ACTIVE" })
  @IsOptional()
  @IsIn(GARAGE_STATUSES)
  status?: GarageStatusValue;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: "/images/featured-garage.jpg" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiProperty({ default: "08:00 – 18:30" })
  @IsString()
  @MaxLength(80)
  openHours!: string;

  @ApiProperty({ default: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  bayCount!: number;

  @ApiProperty({ default: 450000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  startingPriceVnd!: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiProperty()
  @IsString()
  @MinLength(10)
  summary!: string;
}

export class UpdateGarageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @ApiPropertyOptional({ enum: CITY_CODES })
  @IsOptional()
  @IsIn(CITY_CODES)
  cityCode?: GarageCityCodeValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  cityLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(350)
  fullAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  openHours?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  bayCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  startingPriceVnd?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  summary?: string;
}

export class UpdateGarageStatusDto {
  @ApiPropertyOptional({ enum: GARAGE_STATUSES })
  @IsOptional()
  @IsIn(GARAGE_STATUSES)
  status?: GarageStatusValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

