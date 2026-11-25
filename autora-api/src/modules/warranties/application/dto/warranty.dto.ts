import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
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

const WARRANTY_STATUSES = ["ACTIVE", "CLAIMED", "EXPIRED", "VOIDED"] as const;
const ROOT_CAUSES = [
  "WORKMANSHIP",
  "DEFECTIVE_PART",
  "CUSTOMER_MISUSE",
  "OTHER",
] as const;
const CLAIM_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"] as const;

export class WarrantyQueryDto {
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

  @ApiPropertyOptional({ enum: WARRANTY_STATUSES })
  @IsOptional()
  @IsIn(WARRANTY_STATUSES)
  status?: (typeof WARRANTY_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateWarrantyClaimDto {
  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(1500)
  issueDescription!: string;

  @ApiProperty({ enum: ROOT_CAUSES })
  @IsIn(ROOT_CAUSES)
  rootCause!: (typeof ROOT_CAUSES)[number];

  @ApiPropertyOptional({ example: 350000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  internalCostVnd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  resolution?: string;
}

export class UpdateWarrantyClaimDto {
  @ApiPropertyOptional({ enum: CLAIM_STATUSES })
  @IsOptional()
  @IsIn(CLAIM_STATUSES)
  status?: (typeof CLAIM_STATUSES)[number];

  @ApiPropertyOptional({ enum: ROOT_CAUSES })
  @IsOptional()
  @IsIn(ROOT_CAUSES)
  rootCause?: (typeof ROOT_CAUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  internalCostVnd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  resolution?: string;
}

