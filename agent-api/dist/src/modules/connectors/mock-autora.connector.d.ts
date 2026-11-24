import type { AvailabilitySlotDto, BookingDraftDto, BookingDraftInput, GarageDto, GarageSearchInput, IBusinessConnector, OrderSummaryDto, ServiceDto, ServiceSearchInput, VehicleDto } from "./business-connector.interface";
export declare class MockAutoraConnector implements IBusinessConnector {
    searchServices(input: ServiceSearchInput): Promise<readonly ServiceDto[]>;
    searchGarages(input: GarageSearchInput): Promise<readonly GarageDto[]>;
    compareGarages(garageIdsOrSlugs: readonly string[]): Promise<readonly GarageDto[]>;
    checkAvailability(garageIdOrSlug: string, date: string): Promise<AvailabilitySlotDto | null>;
    prepareBookingDraft(input: BookingDraftInput): Promise<BookingDraftDto | null>;
    getMyVehicles(userId: string): Promise<readonly VehicleDto[]>;
    getMyOrders(userId: string): Promise<readonly OrderSummaryDto[]>;
}
