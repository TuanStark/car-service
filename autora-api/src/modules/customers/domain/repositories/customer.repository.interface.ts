import type { PaginatedResult } from "@core/domain/repository.interface";

export type CustomerStatusValue = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface CustomerListFilterCriteria {
  readonly page: number;
  readonly limit: number;
  readonly search?: string;
  readonly status?: CustomerStatusValue;
}

export interface CustomerListItemDto {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly status: CustomerStatusValue;
  readonly lastLoginAt: string | null;
  readonly createdAt: string;
  readonly vehicleCount: number;
  readonly bookingCount: number;
}

export interface CustomerProfileDto extends CustomerListItemDto {
  readonly vehicles: readonly {
    readonly id: string;
    readonly brand: string;
    readonly model: string;
    readonly year: string;
    readonly bodyType: string;
    readonly licensePlate: string;
    readonly currentOdoKm: number;
    readonly isPrimary: boolean;
  }[];
  readonly bookings: readonly {
    readonly id: string;
    readonly orderCode: string;
    readonly appointmentDate: string;
    readonly appointmentTime: string;
    readonly garageName: string;
    readonly vehicleLabel: string;
    readonly status: string;
    readonly paymentStatus: string;
    readonly totalVnd: number;
  }[];
}

export const CUSTOMER_REPOSITORY = Symbol("CUSTOMER_REPOSITORY");

export interface ICustomerRepository {
  findManyAdmin(
    criteria: CustomerListFilterCriteria
  ): Promise<PaginatedResult<CustomerListItemDto>>;
  findProfileById(id: string): Promise<CustomerProfileDto | null>;
}

