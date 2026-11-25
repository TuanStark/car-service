-- CreateEnum
CREATE TYPE "BayType" AS ENUM ('QUICK_SERVICE', 'TWO_POST', 'ALIGNMENT_3D', 'DETAILING');

-- CreateEnum
CREATE TYPE "BayStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "InspectionPhase" AS ENUM ('CHECK_IN', 'CHECK_OUT');

-- CreateEnum
CREATE TYPE "PaymentLogAction" AS ENUM ('CAPTURE', 'REFUND');

-- CreateEnum
CREATE TYPE "CustomerApprovalStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'CHECKED_IN';
ALTER TYPE "BookingStatus" ADD VALUE 'WAITING_APPROVAL';
ALTER TYPE "BookingStatus" ADD VALUE 'QC_PENDING';
ALTER TYPE "BookingStatus" ADD VALUE 'READY_FOR_PICKUP';
ALTER TYPE "BookingStatus" ADD VALUE 'NO_SHOW';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "bay_id" UUID,
ADD COLUMN     "checked_in_at" TIMESTAMP(3),
ADD COLUMN     "customer_approval_status" "CustomerApprovalStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "reschedule_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "work_completed_at" TIMESTAMP(3),
ADD COLUMN     "work_started_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "service_bays" (
    "id" UUID NOT NULL,
    "garage_id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "bay_type" "BayType" NOT NULL DEFAULT 'TWO_POST',
    "status" "BayStatus" NOT NULL DEFAULT 'AVAILABLE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_bays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_inspections" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "phase" "InspectionPhase" NOT NULL,
    "odo_km" INTEGER,
    "fuel_level" VARCHAR(20),
    "checklist_json" JSONB NOT NULL DEFAULT '[]',
    "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "inspected_by_user_id" UUID,
    "inspected_by_email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_payment_logs" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "action" "PaymentLogAction" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount_vnd" INTEGER NOT NULL,
    "reference_code" VARCHAR(80),
    "reason" VARCHAR(500),
    "recorded_by_user_id" UUID,
    "recorded_by_email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_payment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_bays_garage_id_status_idx" ON "service_bays"("garage_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "service_bays_garage_id_code_key" ON "service_bays"("garage_id", "code");

-- CreateIndex
CREATE INDEX "booking_inspections_booking_id_created_at_idx" ON "booking_inspections"("booking_id", "created_at");

-- CreateIndex
CREATE INDEX "booking_payment_logs_booking_id_created_at_idx" ON "booking_payment_logs"("booking_id", "created_at");

-- CreateIndex
CREATE INDEX "bookings_bay_id_appointment_date_appointment_time_idx" ON "bookings"("bay_id", "appointment_date", "appointment_time");

-- AddForeignKey
ALTER TABLE "service_bays" ADD CONSTRAINT "service_bays_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_bay_id_fkey" FOREIGN KEY ("bay_id") REFERENCES "service_bays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_inspections" ADD CONSTRAINT "booking_inspections_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_payment_logs" ADD CONSTRAINT "booking_payment_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
