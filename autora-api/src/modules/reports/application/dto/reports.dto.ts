import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

const EXPENSE_CATEGORIES = [
  "RENT_UTILITIES",
  "BASE_SALARY",
  "SUPPLIER_PAYMENT",
  "EQUIPMENT_MAINT",
  "WASTE_DISPOSAL",
  "MARKETING",
  "OTHER",
] as const;

export class PnlQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  garageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class ExpenseQueryDto {
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

  @ApiPropertyOptional({ enum: EXPENSE_CATEGORIES })
  @IsOptional()
  @IsIn(EXPENSE_CATEGORIES)
  category?: (typeof EXPENSE_CATEGORIES)[number];
}

export class CreateExpenseDto {
  @ApiProperty()
  @IsUUID()
  garageId!: string;

  @ApiProperty({ enum: EXPENSE_CATEGORIES })
  @IsIn(EXPENSE_CATEGORIES)
  category!: (typeof EXPENSE_CATEGORIES)[number];

  @ApiProperty({ example: 5000000 })
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  amountVnd!: number;

  @ApiProperty({ example: "2026-11-25" })
  @IsDateString()
  occurredAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  referenceCode?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(400)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  receiptUrl?: string;
}

