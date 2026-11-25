import { Injectable } from "@nestjs/common";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";

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

@Injectable()
export class CrmUseCases {
  constructor(private readonly uow: PrismaUnitOfWorkService) {}

  async listMaintenanceReminders(): Promise<MaintenanceReminderDto[]> {
    const db = this.uow.getClient();
    const vehicles = await db.customerVehicle.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { id: true, fullName: true, phone: true, email: true } },
        bookings: {
          where: { status: "COMPLETED", deletedAt: null },
          orderBy: { appointmentDate: "desc" },
          take: 1,
          select: { appointmentDate: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const now = Date.now();
    const reminders: MaintenanceReminderDto[] = [];

    for (const v of vehicles) {
      const lastDate = v.bookings[0]?.appointmentDate ?? null;
      const daysSince = lastDate
        ? Math.floor((now - lastDate.getTime()) / 86_400_000)
        : null;

      const step = 5000;
      const nextMilestoneKm =
        Math.max(step, Math.ceil((v.currentOdoKm + 1) / step) * step);
      const kmToMilestone = nextMilestoneKm - v.currentOdoKm;

      const dueByTime = daysSince === null || daysSince >= 150;
      const dueByKm = kmToMilestone <= 1500;

      if (!dueByTime && !dueByKm) continue;

      const reasons: string[] = [];
      if (daysSince === null) {
        reasons.push("Chưa từng bảo dưỡng trên hệ thống");
      } else if (daysSince >= 150) {
        reasons.push(`${daysSince} ngày chưa bảo dưỡng`);
      }
      if (dueByKm) {
        reasons.push(
          `Sắp chạm mốc ${new Intl.NumberFormat("vi-VN").format(nextMilestoneKm)} km (còn ${kmToMilestone} km)`
        );
      }

      reminders.push({
        vehicleId: v.id,
        licensePlate: v.licensePlate,
        vehicleLabel: `${v.brand} ${v.model} (${v.year})`,
        currentOdoKm: v.currentOdoKm,
        nextMilestoneKm,
        kmToMilestone,
        customerId: v.user.id,
        customerName: v.user.fullName,
        customerPhone: v.user.phone,
        customerEmail: v.user.email,
        lastCompletedAt: lastDate?.toISOString().slice(0, 10) ?? null,
        daysSinceLastService: daysSince,
        reason: reasons.join(" • "),
      });
    }

    return reminders;
  }
}

