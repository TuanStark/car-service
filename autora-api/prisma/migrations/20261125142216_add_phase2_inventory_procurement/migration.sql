-- CreateEnum
CREATE TYPE "PartCategory" AS ENUM ('OIL_FLUID', 'FILTER', 'BRAKE', 'TIRE', 'BATTERY', 'DETAILING_CHEM', 'SPARE_PART');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN_PO', 'OUT_WORK_ORDER', 'RETURN_WORK_ORDER', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "address" VARCHAR(350),
    "tax_code" VARCHAR(30),
    "payment_terms_days" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_items" (
    "id" UUID NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "oem_code" VARCHAR(60),
    "name" VARCHAR(200) NOT NULL,
    "category" "PartCategory" NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "min_stock_qty" DECIMAL(10,2) NOT NULL DEFAULT 5,
    "avg_cost_vnd" INTEGER NOT NULL DEFAULT 0,
    "sell_price_vnd" INTEGER NOT NULL DEFAULT 0,
    "image_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "part_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garage_inventories" (
    "id" UUID NOT NULL,
    "garage_id" UUID NOT NULL,
    "part_item_id" UUID NOT NULL,
    "on_hand_qty" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reserved_qty" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bin_location" VARCHAR(60),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garage_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_part_recipes" (
    "id" UUID NOT NULL,
    "service_product_id" UUID NOT NULL,
    "part_item_id" UUID NOT NULL,
    "vehicle_body_type" "VehicleBodyType" NOT NULL DEFAULT 'ALL',
    "standard_qty" DECIMAL(10,2) NOT NULL,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "service_part_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "po_code" VARCHAR(40) NOT NULL,
    "supplier_id" UUID NOT NULL,
    "garage_id" UUID NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "total_cost_vnd" INTEGER NOT NULL DEFAULT 0,
    "paid_amount_vnd" INTEGER NOT NULL DEFAULT 0,
    "expected_date" DATE,
    "received_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by_email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "part_item_id" UUID NOT NULL,
    "ordered_qty" DECIMAL(10,2) NOT NULL,
    "received_qty" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "unit_cost_vnd" INTEGER NOT NULL,
    "line_total_vnd" INTEGER NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "garage_id" UUID NOT NULL,
    "part_item_id" UUID NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "qty_delta" DECIMAL(10,2) NOT NULL,
    "unit_cost_vnd" INTEGER NOT NULL,
    "reference_type" VARCHAR(40),
    "reference_id" VARCHAR(80),
    "reason" VARCHAR(500),
    "created_by_email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_part_usages" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "part_item_id" UUID NOT NULL,
    "garage_id" UUID NOT NULL,
    "qty_used" DECIMAL(10,2) NOT NULL,
    "unit_cost_vnd" INTEGER NOT NULL,
    "unit_sell_vnd" INTEGER NOT NULL,
    "line_cost_vnd" INTEGER NOT NULL,
    "issued_by_email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_part_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE INDEX "suppliers_is_active_deleted_at_idx" ON "suppliers"("is_active", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "part_items_sku_key" ON "part_items"("sku");

-- CreateIndex
CREATE INDEX "part_items_category_is_active_deleted_at_idx" ON "part_items"("category", "is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "garage_inventories_garage_id_idx" ON "garage_inventories"("garage_id");

-- CreateIndex
CREATE UNIQUE INDEX "garage_inventories_garage_id_part_item_id_key" ON "garage_inventories"("garage_id", "part_item_id");

-- CreateIndex
CREATE INDEX "service_part_recipes_service_product_id_idx" ON "service_part_recipes"("service_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_part_recipes_service_product_id_part_item_id_vehicl_key" ON "service_part_recipes"("service_product_id", "part_item_id", "vehicle_body_type");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_code_key" ON "purchase_orders"("po_code");

-- CreateIndex
CREATE INDEX "purchase_orders_garage_id_status_created_at_idx" ON "purchase_orders"("garage_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_id_status_idx" ON "purchase_orders"("supplier_id", "status");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchase_order_id_idx" ON "purchase_order_items"("purchase_order_id");

-- CreateIndex
CREATE INDEX "stock_movements_garage_id_part_item_id_created_at_idx" ON "stock_movements"("garage_id", "part_item_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE INDEX "booking_part_usages_booking_id_idx" ON "booking_part_usages"("booking_id");

-- CreateIndex
CREATE INDEX "booking_part_usages_garage_id_created_at_idx" ON "booking_part_usages"("garage_id", "created_at");

-- AddForeignKey
ALTER TABLE "garage_inventories" ADD CONSTRAINT "garage_inventories_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_inventories" ADD CONSTRAINT "garage_inventories_part_item_id_fkey" FOREIGN KEY ("part_item_id") REFERENCES "part_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_part_recipes" ADD CONSTRAINT "service_part_recipes_service_product_id_fkey" FOREIGN KEY ("service_product_id") REFERENCES "service_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_part_recipes" ADD CONSTRAINT "service_part_recipes_part_item_id_fkey" FOREIGN KEY ("part_item_id") REFERENCES "part_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_part_item_id_fkey" FOREIGN KEY ("part_item_id") REFERENCES "part_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_part_item_id_fkey" FOREIGN KEY ("part_item_id") REFERENCES "part_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_part_usages" ADD CONSTRAINT "booking_part_usages_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_part_usages" ADD CONSTRAINT "booking_part_usages_part_item_id_fkey" FOREIGN KEY ("part_item_id") REFERENCES "part_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_part_usages" ADD CONSTRAINT "booking_part_usages_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
