import { apiData } from "@/infrastructure/api/api-client";

export interface MaintenanceReminderDto {
  readonly vehicleId: string;
  readonly licensePlate: string;
  readonly vehicleLabel: string;
  readonly currentOdoKm: number;
  readonly nextMilestoneKm: number;
  readonly kmToMilestone: number;
  readonly customerId: string;
  readonly customerName: string;
  readonly customerPhone: string | null;
  readonly customerEmail: string;
  readonly lastCompletedAt: string | null;
  readonly daysSinceLastService: number | null;
  readonly reason: string;
}

export function fetchMaintenanceReminders(): Promise<MaintenanceReminderDto[]> {
  return apiData<MaintenanceReminderDto[]>("/admin/crm/reminders");
}

