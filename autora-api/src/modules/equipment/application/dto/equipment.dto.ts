import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
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
} from "class-validator";

const EQUIPMENT_CATEGORIES = [
  "LIFT",
  "DIAGNOSTIC_SCANNER",
  "WHEEL_ALIGNMENT",
  "AC_MACHINE",
  "PAINT_BOOTH",
  "SPECIAL_TOOL",
] as const;

const EQUIPMENT_STATUSES = [
  "OPERATIONAL",
  "IN_USE",
  "MAINTENANCE",
  "BROKEN",
] as const;

const MAINTENANCE_TYPES = ["ROUTINE", "CALIBRATION", "REPAIR"] as const;
const RETURN_CONDITIONS = ["GOOD", "DAMAGED", "MISSING"] as const;

export class EquipmentQueryDto {
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

  @ApiPropertyOptional({ enum: EQUIPMENT_CATEGORIES })
  @IsOptional()
  @IsIn(EQUIPMENT_CATEGORIES)
  category?: (typeof EQUIPMENT_CATEGORIES)[number];

  @ApiPropertyOptional({ enum: EQUIPMENT_STATUSES })
  @IsOptional()
  @IsIn(EQUIPMENT_STATUSES)
  status?: (typeof EQUIPMENT_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  checkedOutOnly?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  dueSoonOnly?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateEquipmentDto {
  @ApiProperty()
  @IsUUID()
  garageId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  serviceBayId?: string;

  @ApiProperty({ example: "EQ-SCAN-02" })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[A-Z0-9-]+$/, {
    message: "Mã tài sản chỉ gồm chữ in hoa, số và dấu gạch ngang.",
  })
  assetCode!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: EQUIPMENT_CATEGORIES })
  @IsIn(EQUIPMENT_CATEGORIES)
  category!: (typeof EQUIPMENT_CATEGORIES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  brandModel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  purchaseCostVnd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextMaintenanceAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  calibrationDueAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateEquipmentDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  serviceBayId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: EQUIPMENT_STATUSES })
  @IsOptional()
  @IsIn(EQUIPMENT_STATUSES)
  status?: (typeof EQUIPMENT_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextMaintenanceAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  calibrationDueAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class RecordEquipmentMaintenanceDto {
  @ApiProperty({ enum: MAINTENANCE_TYPES })
  @IsIn(MAINTENANCE_TYPES)
  maintenanceType!: (typeof MAINTENANCE_TYPES)[number];

  @ApiProperty({ example: 1500000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  costVnd!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  vendorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextDueAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  restoreOperational?: boolean;
}

export class CheckoutToolDto {
  @ApiProperty()
  @IsUUID()
  technicianUserId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedReturnAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(400)
  notes?: string;
}

export class ReturnToolDto {
  @ApiProperty({ enum: RETURN_CONDITIONS })
  @IsIn(RETURN_CONDITIONS)
  returnCondition!: (typeof RETURN_CONDITIONS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(400)
  notes?: string;
}

