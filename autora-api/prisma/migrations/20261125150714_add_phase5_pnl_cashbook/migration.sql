-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT_UTILITIES', 'BASE_SALARY', 'SUPPLIER_PAYMENT', 'EQUIPMENT_MAINT', 'WASTE_DISPOSAL', 'MARKETING', 'OTHER');

-- AlterTable
ALTER TABLE "garages" ADD COLUMN     "commission_rate_bps" INTEGER NOT NULL DEFAULT 1000;

-- CreateTable
CREATE TABLE "expense_entries" (
    "id" UUID NOT NULL,
    "garage_id" UUID NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount_vnd" INTEGER NOT NULL,
    "occurred_at" DATE NOT NULL,
    "reference_code" VARCHAR(60),
    "description" VARCHAR(400) NOT NULL,
    "receipt_url" VARCHAR(500),
    "recorded_by_email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expense_entries_garage_id_occurred_at_idx" ON "expense_entries"("garage_id", "occurred_at");

-- CreateIndex
CREATE INDEX "expense_entries_category_occurred_at_idx" ON "expense_entries"("category", "occurred_at");

-- AddForeignKey
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
