import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

const STAFF_ROLES = ["admin", "ops_staff", "partner_staff", "technician"] as const;
const SPECIALTIES = [
  "GENERAL_MAINT",
  "POWERTRAIN",
  "CHASSIS_BRAKE",
  "ELECTRICAL",
  "DETAILING",
  "TIRES",
] as const;
const SKILL_LEVELS = ["JUNIOR", "SENIOR", "MASTER"] as const;

export class StaffQueryDto {
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

  @ApiPropertyOptional({ enum: STAFF_ROLES })
  @IsOptional()
  @IsIn(STAFF_ROLES)
  roleCode?: (typeof STAFF_ROLES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  garageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateStaffDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;

  @ApiProperty({ enum: STAFF_ROLES })
  @IsIn(STAFF_ROLES)
  roleCode!: (typeof STAFF_ROLES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  primaryGarageId?: string;

  @ApiPropertyOptional({ enum: SPECIALTIES })
  @IsOptional()
  @IsIn(SPECIALTIES)
  specialty?: (typeof SPECIALTIES)[number];

  @ApiPropertyOptional({ enum: SKILL_LEVELS })
  @IsOptional()
  @IsIn(SKILL_LEVELS)
  skillLevel?: (typeof SKILL_LEVELS)[number];

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(80)
  laborCommissionPct?: number;

  @ApiPropertyOptional({ example: 95000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hourlyRateVnd?: number;
}

export class UpdateTechnicianProfileDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  primaryGarageId?: string | null;

  @ApiPropertyOptional({ enum: SPECIALTIES })
  @IsOptional()
  @IsIn(SPECIALTIES)
  specialty?: (typeof SPECIALTIES)[number];

  @ApiPropertyOptional({ enum: SKILL_LEVELS })
  @IsOptional()
  @IsIn(SKILL_LEVELS)
  skillLevel?: (typeof SKILL_LEVELS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(80)
  laborCommissionPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hourlyRateVnd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

