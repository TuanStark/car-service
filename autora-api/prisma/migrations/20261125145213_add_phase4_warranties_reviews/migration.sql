-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('ACTIVE', 'CLAIMED', 'EXPIRED', 'VOIDED');

-- CreateEnum
CREATE TYPE "WarrantyRootCause" AS ENUM ('WORKMANSHIP', 'DEFECTIVE_PART', 'CUSTOMER_MISUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "WarrantyClaimStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "admin_reply" TEXT,
ADD COLUMN     "is_hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "replied_at" TIMESTAMP(3),
ADD COLUMN     "replied_by_email" VARCHAR(255);

-- CreateTable
CREATE TABLE "warranty_records" (
    "id" UUID NOT NULL,
    "warranty_code" VARCHAR(40) NOT NULL,
    "booking_id" UUID NOT NULL,
    "vehicle_id" UUID,
    "garage_id" UUID NOT NULL,
    "service_product_id" UUID,
    "service_name_snap" VARCHAR(220) NOT NULL,
    "license_plate" VARCHAR(24) NOT NULL,
    "customer_name" VARCHAR(150) NOT NULL,
    "warranty_label" VARCHAR(120) NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until_date" DATE NOT NULL,
    "start_odo_km" INTEGER NOT NULL DEFAULT 0,
    "valid_until_odo_km" INTEGER,
    "status" "WarrantyStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranty_claims" (
    "id" UUID NOT NULL,
    "warranty_record_id" UUID NOT NULL,
    "claim_booking_id" UUID,
    "issue_description" TEXT NOT NULL,
    "root_cause" "WarrantyRootCause" NOT NULL DEFAULT 'WORKMANSHIP',
    "internal_cost_vnd" INTEGER NOT NULL DEFAULT 0,
    "resolution" TEXT,
    "status" "WarrantyClaimStatus" NOT NULL DEFAULT 'OPEN',
    "handled_by_email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warranty_records_warranty_code_key" ON "warranty_records"("warranty_code");

-- CreateIndex
CREATE INDEX "warranty_records_garage_id_status_idx" ON "warranty_records"("garage_id", "status");

-- CreateIndex
CREATE INDEX "warranty_records_license_plate_idx" ON "warranty_records"("license_plate");

-- CreateIndex
CREATE INDEX "warranty_records_booking_id_idx" ON "warranty_records"("booking_id");

-- CreateIndex
CREATE INDEX "warranty_claims_warranty_record_id_status_idx" ON "warranty_claims"("warranty_record_id", "status");

-- AddForeignKey
ALTER TABLE "warranty_records" ADD CONSTRAINT "warranty_records_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_records" ADD CONSTRAINT "warranty_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "customer_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_records" ADD CONSTRAINT "warranty_records_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_records" ADD CONSTRAINT "warranty_records_service_product_id_fkey" FOREIGN KEY ("service_product_id") REFERENCES "service_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_warranty_record_id_fkey" FOREIGN KEY ("warranty_record_id") REFERENCES "warranty_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_claim_booking_id_fkey" FOREIGN KEY ("claim_booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
