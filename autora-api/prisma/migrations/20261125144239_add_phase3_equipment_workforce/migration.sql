-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('LIFT', 'DIAGNOSTIC_SCANNER', 'WHEEL_ALIGNMENT', 'AC_MACHINE', 'PAINT_BOOTH', 'SPECIAL_TOOL');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIONAL', 'IN_USE', 'MAINTENANCE', 'BROKEN');

-- CreateEnum
CREATE TYPE "EquipmentMaintenanceType" AS ENUM ('ROUTINE', 'CALIBRATION', 'REPAIR');

-- CreateEnum
CREATE TYPE "ToolReturnCondition" AS ENUM ('GOOD', 'DAMAGED', 'MISSING');

-- CreateEnum
CREATE TYPE "TechnicianSpecialty" AS ENUM ('GENERAL_MAINT', 'POWERTRAIN', 'CHASSIS_BRAKE', 'ELECTRICAL', 'DETAILING', 'TIRES');

-- CreateEnum
CREATE TYPE "TechnicianSkillLevel" AS ENUM ('JUNIOR', 'SENIOR', 'MASTER');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "assigned_technician_id" UUID;

-- CreateTable
CREATE TABLE "workshop_equipments" (
    "id" UUID NOT NULL,
    "garage_id" UUID NOT NULL,
    "service_bay_id" UUID,
    "asset_code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" "EquipmentCategory" NOT NULL,
    "brand_model" VARCHAR(150),
    "serial_number" VARCHAR(100),
    "status" "EquipmentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "purchase_date" DATE,
    "purchase_cost_vnd" INTEGER NOT NULL DEFAULT 0,
    "next_maintenance_at" DATE,
    "calibration_due_at" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_maintenance_logs" (
    "id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "maintenance_type" "EquipmentMaintenanceType" NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cost_vnd" INTEGER NOT NULL DEFAULT 0,
    "vendor_name" VARCHAR(150),
    "next_due_at" DATE,
    "notes" TEXT,
    "recorded_by_email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_checkout_logs" (
    "id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "technician_user_id" UUID NOT NULL,
    "booking_id" UUID,
    "checked_out_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_return_at" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),
    "return_condition" "ToolReturnCondition",
    "notes" VARCHAR(400),

    CONSTRAINT "tool_checkout_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_profiles" (
    "user_id" UUID NOT NULL,
    "primary_garage_id" UUID,
    "specialty" "TechnicianSpecialty" NOT NULL DEFAULT 'GENERAL_MAINT',
    "skill_level" "TechnicianSkillLevel" NOT NULL DEFAULT 'SENIOR',
    "labor_commission_pct" DECIMAL(5,2) NOT NULL DEFAULT 15.0,
    "hourly_rate_vnd" INTEGER NOT NULL DEFAULT 80000,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technician_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workshop_equipments_asset_code_key" ON "workshop_equipments"("asset_code");

-- CreateIndex
CREATE INDEX "workshop_equipments_garage_id_status_idx" ON "workshop_equipments"("garage_id", "status");

-- CreateIndex
CREATE INDEX "workshop_equipments_calibration_due_at_idx" ON "workshop_equipments"("calibration_due_at");

-- CreateIndex
CREATE INDEX "workshop_equipments_next_maintenance_at_idx" ON "workshop_equipments"("next_maintenance_at");

-- CreateIndex
CREATE INDEX "equipment_maintenance_logs_equipment_id_performed_at_idx" ON "equipment_maintenance_logs"("equipment_id", "performed_at");

-- CreateIndex
CREATE INDEX "tool_checkout_logs_equipment_id_returned_at_idx" ON "tool_checkout_logs"("equipment_id", "returned_at");

-- CreateIndex
CREATE INDEX "tool_checkout_logs_technician_user_id_returned_at_idx" ON "tool_checkout_logs"("technician_user_id", "returned_at");

-- CreateIndex
CREATE INDEX "technician_profiles_primary_garage_id_is_active_idx" ON "technician_profiles"("primary_garage_id", "is_active");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assigned_technician_id_fkey" FOREIGN KEY ("assigned_technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_equipments" ADD CONSTRAINT "workshop_equipments_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_equipments" ADD CONSTRAINT "workshop_equipments_service_bay_id_fkey" FOREIGN KEY ("service_bay_id") REFERENCES "service_bays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_maintenance_logs" ADD CONSTRAINT "equipment_maintenance_logs_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "workshop_equipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_checkout_logs" ADD CONSTRAINT "tool_checkout_logs_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "workshop_equipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_checkout_logs" ADD CONSTRAINT "tool_checkout_logs_technician_user_id_fkey" FOREIGN KEY ("technician_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_checkout_logs" ADD CONSTRAINT "tool_checkout_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_profiles" ADD CONSTRAINT "technician_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_profiles" ADD CONSTRAINT "technician_profiles_primary_garage_id_fkey" FOREIGN KEY ("primary_garage_id") REFERENCES "garages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
