import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
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
  ValidateNested,
} from "class-validator";
import type {
  PaymentActionValue,
  PaymentMethodValue,
} from "../../domain/booking-payment-machine";
import type { BookingStatusValue } from "../../domain/booking-status-machine";

const BOOKING_STATUS_VALUES: readonly BookingStatusValue[] = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "WAITING_APPROVAL",
  "QC_PENDING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

const PAYMENT_METHODS: readonly PaymentMethodValue[] = [
  "PAY_AT_GARAGE",
  "VIETQR",
  "VNPAY",
];

const PAYMENT_ACTIONS: readonly PaymentActionValue[] = ["CAPTURE", "REFUND"];

export class AdminBookingQueryDto {
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

  @ApiPropertyOptional({ enum: BOOKING_STATUS_VALUES })
  @IsOptional()
  @IsIn(BOOKING_STATUS_VALUES)
  status?: BookingStatusValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  garageId?: string;

  @ApiPropertyOptional({ example: "2026-11-01" })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: "2026-11-30" })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: ["createdAt", "appointmentDate", "totalVnd"] })
  @IsOptional()
  @IsIn(["createdAt", "appointmentDate", "totalVnd"])
  sortBy?: "createdAt" | "appointmentDate" | "totalVnd";

  @ApiPropertyOptional({ enum: ["asc", "desc"] })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";
}

export class DispatchScheduleQueryDto {
  @ApiProperty({ example: "2026-11-26" })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  garageId?: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BOOKING_STATUS_VALUES })
  @IsIn(BOOKING_STATUS_VALUES, {
    message: "Trạng thái lịch hẹn không hợp lệ.",
  })
  status!: BookingStatusValue;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Lý do không được vượt quá 500 ký tự." })
  reason?: string;
}

export class CreateBookingItemInputDto {
  @ApiProperty()
  @IsUUID()
  serviceProductId!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  quantity?: number;
}

export class CreateAdminBookingDto {
  @ApiProperty()
  @IsUUID()
  garageId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bayId?: string;

  @ApiProperty({ example: "2026-11-27" })
  @IsDateString()
  appointmentDate!: string;

  @ApiProperty({ example: "09:30" })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "Giờ hẹn phải có dạng HH:mm." })
  appointmentTime!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  customerName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  customerPhone!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  vehicleLabel!: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(24)
  licensePlate!: string;

  @ApiProperty({ example: 25000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2_000_000)
  odoKm!: number;

  @ApiPropertyOptional({ enum: PAYMENT_METHODS, default: "PAY_AT_GARAGE" })
  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  paymentMethod?: PaymentMethodValue;

  @ApiPropertyOptional({ enum: ["PENDING_CONFIRMATION", "CONFIRMED", "CHECKED_IN"] })
  @IsOptional()
  @IsIn(["PENDING_CONFIRMATION", "CONFIRMED", "CHECKED_IN"])
  initialStatus?: "PENDING_CONFIRMATION" | "CONFIRMED" | "CHECKED_IN";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowOverbook?: boolean;

  @ApiProperty({ type: [CreateBookingItemInputDto] })
  @IsArray()
  @ArrayMinSize(1, { message: "Vui lòng chọn ít nhất 1 dịch vụ." })
  @ValidateNested({ each: true })
  @Type(() => CreateBookingItemInputDto)
  items!: CreateBookingItemInputDto[];
}

export class RescheduleBookingDto {
  @ApiProperty({ example: "2026-11-28" })
  @IsDateString()
  appointmentDate!: string;

  @ApiProperty({ example: "11:00" })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  appointmentTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  garageId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  bayId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2_000_000)
  odoKm?: number;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowOverbook?: boolean;
}

export class RecordBookingPaymentDto {
  @ApiProperty({ enum: PAYMENT_ACTIONS })
  @IsIn(PAYMENT_ACTIONS)
  action!: PaymentActionValue;

  @ApiProperty({ enum: PAYMENT_METHODS })
  @IsIn(PAYMENT_METHODS)
  method!: PaymentMethodValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  referenceCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class AddBookingItemDto {
  @ApiProperty()
  @IsUUID()
  serviceProductId!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  customUnitPriceVnd?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  markWaitingApproval?: boolean;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class RemoveBookingItemDto {
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class InspectionChecklistItemDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiProperty({ enum: ["OK", "ATTENTION", "REPLACE"] })
  @IsIn(["OK", "ATTENTION", "REPLACE"])
  status!: "OK" | "ATTENTION" | "REPLACE";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

export class RecordBookingInspectionDto {
  @ApiProperty({ enum: ["CHECK_IN", "CHECK_OUT"] })
  @IsIn(["CHECK_IN", "CHECK_OUT"])
  phase!: "CHECK_IN" | "CHECK_OUT";

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2_000_000)
  odoKm?: number;

  @ApiPropertyOptional({ enum: ["E", "1/4", "1/2", "3/4", "F"] })
  @IsOptional()
  @IsIn(["E", "1/4", "1/2", "3/4", "F"])
  fuelLevel?: "E" | "1/4" | "1/2" | "3/4" | "F";

  @ApiPropertyOptional({ type: [InspectionChecklistItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InspectionChecklistItemDto)
  checklist?: InspectionChecklistItemDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class IssueManualPartDto {
  @ApiProperty()
  @IsUUID()
  partItemId!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(10000)
  qtyUsed!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  note?: string;
}
