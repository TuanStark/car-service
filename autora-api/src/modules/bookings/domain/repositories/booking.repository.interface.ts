import type { PaginatedResult } from "@core/domain/repository.interface";
import type { BookingStatusValue } from "../booking-status-machine";

export interface BookingListFilterCriteria {
  readonly page: number;
  readonly limit: number;
  readonly search?: string;
  readonly status?: BookingStatusValue;
  readonly garageId?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly sortBy?: "createdAt" | "appointmentDate" | "totalVnd";
  readonly sortOrder?: "asc" | "desc";
}

export interface BookingListItemDto {
  readonly id: string;
  readonly orderCode: string;
  readonly appointmentDate: string;
  readonly appointmentTime: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly vehicleLabel: string;
  readonly licensePlate: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly bayId: string | null;
  readonly bayName: string | null;
  readonly status: BookingStatusValue;
  readonly paymentMethod: string;
  readonly paymentStatus: string;
  readonly totalVnd: number;
  readonly version: number;
  readonly itemCount: number;
  readonly createdAt: string;
}

export interface BookingInspectionDto {
  readonly id: string;
  readonly phase: "CHECK_IN" | "CHECK_OUT";
  readonly odoKm: number | null;
  readonly fuelLevel: string | null;
  readonly checklist: readonly {
    readonly label: string;
    readonly status: "OK" | "ATTENTION" | "REPLACE";
    readonly note?: string;
  }[];
  readonly photoUrls: readonly string[];
  readonly notes: string | null;
  readonly inspectedByEmail: string | null;
  readonly createdAt: string;
}

export interface BookingPaymentLogDto {
  readonly id: string;
  readonly action: "CAPTURE" | "REFUND";
  readonly method: string;
  readonly amountVnd: number;
  readonly referenceCode: string | null;
  readonly reason: string | null;
  readonly recordedByEmail: string | null;
  readonly createdAt: string;
}

export interface BookingDetailDto {
  readonly id: string;
  readonly orderCode: string;
  readonly appointmentDate: string;
  readonly appointmentTime: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly userId: string | null;
  readonly userEmail: string | null;
  readonly garageId: string;
  readonly garageName: string;
  readonly garageAddress: string;
  readonly bayId: string | null;
  readonly bayCode: string | null;
  readonly bayName: string | null;
  readonly vehicleId: string | null;
  readonly vehicleLabel: string;
  readonly licensePlate: string;
  readonly odoKm: number;
  readonly paymentMethod: string;
  readonly paymentStatus: string;
  readonly status: BookingStatusValue;
  readonly customerApprovalStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  readonly allowedNextStatuses: readonly BookingStatusValue[];
  readonly subtotalVnd: number;
  readonly discountVnd: number;
  readonly totalVnd: number;
  readonly notes: string | null;
  readonly checkedInAt: string | null;
  readonly workStartedAt: string | null;
  readonly workCompletedAt: string | null;
  readonly rescheduleCount: number;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly items: readonly {
    readonly id: string;
    readonly serviceProductId: string;
    readonly serviceNameSnap: string;
    readonly skuSnap: string;
    readonly unitPriceVnd: number;
    readonly quantity: number;
    readonly lineTotalVnd: number;
  }[];
  readonly statusHistory: readonly {
    readonly id: string;
    readonly fromStatus: BookingStatusValue | null;
    readonly toStatus: BookingStatusValue;
    readonly reason: string | null;
    readonly changedByEmail: string | null;
    readonly createdAt: string;
  }[];
  readonly inspections: readonly BookingInspectionDto[];
  readonly paymentLogs: readonly BookingPaymentLogDto[];
}

export interface TransitionBookingStatusParams {
  readonly id: string;
  readonly fromStatus: BookingStatusValue;
  readonly toStatus: BookingStatusValue;
  readonly expectedVersion: number;
  readonly reason?: string;
  readonly changedByUserId: string;
  readonly changedByEmail: string;
}

export const BOOKING_REPOSITORY = Symbol("BOOKING_REPOSITORY");

export interface IBookingRepository {
  findManyAdmin(
    criteria: BookingListFilterCriteria
  ): Promise<PaginatedResult<BookingListItemDto>>;
  findDetailById(id: string): Promise<BookingDetailDto | null>;
  transitionStatusWithVersion(
    params: TransitionBookingStatusParams
  ): Promise<boolean>;
}
