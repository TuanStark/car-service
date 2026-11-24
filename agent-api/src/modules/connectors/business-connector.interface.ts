export interface ServiceSearchInput {
  readonly query?: string;
  readonly categoryId?: string;
  readonly maxPriceVnd?: number;
}

export interface ServiceDto {
  readonly id: string;
  readonly sku: string;
  readonly slug: string;
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly name: string;
  readonly shortSummary: string;
  readonly priceVnd: number;
  readonly estimatedDuration: string;
  readonly warrantyLabel: string;
}

export interface GarageSearchInput {
  readonly query?: string;
  readonly city?: "hcm" | "hn" | "dn" | "all";
  readonly serviceCategory?: string;
  readonly minRating?: number;
}

export interface GarageDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly district: string;
  readonly cityCode: string;
  readonly fullAddress: string;
  readonly rating: number;
  readonly reviewCount: number;
  readonly startingPriceVnd: number;
  readonly openHours: string;
  readonly availableServices: readonly string[];
}

export interface AvailabilitySlotDto {
  readonly garageId: string;
  readonly garageName: string;
  readonly date: string;
  readonly availableSlots: readonly string[];
}

export interface BookingDraftInput {
  readonly garageId: string;
  readonly serviceSlug: string;
  readonly vehicleBrand?: string;
  readonly vehicleModel?: string;
  readonly preferredDate?: string;
  readonly preferredTime?: string;
  readonly notes?: string;
}

export interface BookingDraftDto {
  readonly draftId: string;
  readonly garageId: string;
  readonly garageName: string;
  readonly serviceSlug: string;
  readonly serviceName: string;
  readonly estimatedPriceVnd: number;
  readonly preferredDate: string;
  readonly preferredTime: string;
  readonly vehicleBrand?: string;
  readonly vehicleModel?: string;
  readonly notes?: string;
  readonly requiresUserConfirmation: true;
}

export interface VehicleDto {
  readonly id: string;
  readonly brand: string;
  readonly model: string;
  readonly year: string;
  readonly licensePlate: string;
  readonly currentOdoKm: string;
}

export interface OrderSummaryDto {
  readonly orderCode: string;
  readonly appointmentDate: string;
  readonly appointmentTime: string;
  readonly garageName: string;
  readonly serviceName: string;
  readonly totalVnd: number;
  readonly status: string;
}

/**
 * Decoupled Business Backend Contract.
 * Phase 1 uses MockAutoraConnector; future phases swap to HttpBusinessConnector
 * pointing at the real Business API without changing Agent Core or SDK.
 */
export interface IBusinessConnector {
  searchServices(input: ServiceSearchInput): Promise<readonly ServiceDto[]>;
  searchGarages(input: GarageSearchInput): Promise<readonly GarageDto[]>;
  compareGarages(garageIdsOrSlugs: readonly string[]): Promise<readonly GarageDto[]>;
  checkAvailability(garageIdOrSlug: string, date: string): Promise<AvailabilitySlotDto | null>;
  prepareBookingDraft(input: BookingDraftInput): Promise<BookingDraftDto | null>;
  getMyVehicles(userId: string): Promise<readonly VehicleDto[]>;
  getMyOrders(userId: string): Promise<readonly OrderSummaryDto[]>;
}

