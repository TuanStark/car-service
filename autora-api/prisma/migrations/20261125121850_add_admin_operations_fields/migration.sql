-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VehicleBodyType" AS ENUM ('ALL', 'SEDAN', 'SUV', 'MPV', 'EV');

-- CreateEnum
CREATE TYPE "ServiceBadge" AS ENUM ('BEST_SELLER', 'PROMO', 'NEW', 'RECOMMENDED');

-- CreateEnum
CREATE TYPE "CityCode" AS ENUM ('HCM', 'HN', 'DN');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAY_AT_GARAGE', 'VIETQR', 'VNPAY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_VND');

-- CreateEnum
CREATE TYPE "GarageStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "avatar_url" VARCHAR(500),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(80) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "user_agent" VARCHAR(500),
    "ip_address" VARCHAR(64),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "replaced_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "correlation_id" VARCHAR(64),
    "actor_user_id" UUID,
    "actor_email" VARCHAR(255),
    "event_name" VARCHAR(120) NOT NULL,
    "resource_type" VARCHAR(80) NOT NULL,
    "resource_id" VARCHAR(120),
    "payload_json" JSONB,
    "ip_address" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "display_number" VARCHAR(10) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "short_label" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "starting_price_vnd" INTEGER NOT NULL,
    "estimated_duration" VARCHAR(60) NOT NULL,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_products" (
    "id" UUID NOT NULL,
    "sku" VARCHAR(40) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "category_id" UUID NOT NULL,
    "name" VARCHAR(220) NOT NULL,
    "short_summary" VARCHAR(400) NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "gallery_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price_vnd" INTEGER NOT NULL,
    "original_price_vnd" INTEGER,
    "discount_percent" INTEGER,
    "badge" "ServiceBadge",
    "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 5.0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "booked_count" INTEGER NOT NULL DEFAULT 0,
    "estimated_duration" VARCHAR(60) NOT NULL,
    "warranty_label" VARCHAR(120) NOT NULL,
    "compatible_vehicles" "VehicleBodyType"[] DEFAULT ARRAY['ALL']::"VehicleBodyType"[],
    "compatible_brands_label" VARCHAR(200) NOT NULL,
    "included_steps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specifications_json" JSONB NOT NULL DEFAULT '[]',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "service_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garages" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "owner_user_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "district" VARCHAR(120) NOT NULL,
    "city_code" "CityCode" NOT NULL,
    "city_label" VARCHAR(80) NOT NULL,
    "full_address" VARCHAR(350) NOT NULL,
    "phone" VARCHAR(20),
    "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 5.0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "GarageStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "cover_image_url" VARCHAR(500) NOT NULL,
    "open_hours" VARCHAR(80) NOT NULL,
    "bay_count" INTEGER NOT NULL DEFAULT 4,
    "starting_price_vnd" INTEGER NOT NULL,
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "garages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garage_services" (
    "garage_id" UUID NOT NULL,
    "service_product_id" UUID NOT NULL,
    "custom_price_vnd" INTEGER,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garage_services_pkey" PRIMARY KEY ("garage_id","service_product_id")
);

-- CreateTable
CREATE TABLE "customer_vehicles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "brand" VARCHAR(80) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" VARCHAR(10) NOT NULL,
    "body_type" "VehicleBodyType" NOT NULL DEFAULT 'SEDAN',
    "license_plate" VARCHAR(24) NOT NULL,
    "current_odo_km" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customer_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "discount_type" "CouponDiscountType" NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "max_discount_vnd" INTEGER,
    "min_order_vnd" INTEGER NOT NULL DEFAULT 0,
    "usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "order_code" VARCHAR(32) NOT NULL,
    "user_id" UUID,
    "garage_id" UUID NOT NULL,
    "vehicle_id" UUID,
    "coupon_id" UUID,
    "appointment_date" DATE NOT NULL,
    "appointment_time" VARCHAR(10) NOT NULL,
    "customer_name" VARCHAR(150) NOT NULL,
    "customer_phone" VARCHAR(20) NOT NULL,
    "vehicle_label" VARCHAR(160) NOT NULL,
    "license_plate" VARCHAR(24) NOT NULL,
    "odo_km" INTEGER NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'PAY_AT_GARAGE',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "subtotal_vnd" INTEGER NOT NULL,
    "discount_vnd" INTEGER NOT NULL DEFAULT 0,
    "total_vnd" INTEGER NOT NULL,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_histories" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "from_status" "BookingStatus",
    "to_status" "BookingStatus" NOT NULL,
    "reason" VARCHAR(500),
    "changed_by_user_id" UUID,
    "changed_by_email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_items" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "service_product_id" UUID NOT NULL,
    "service_name_snap" VARCHAR(220) NOT NULL,
    "sku_snap" VARCHAR(40) NOT NULL,
    "unit_price_vnd" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "line_total_vnd" INTEGER NOT NULL,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "garage_id" UUID,
    "service_product_id" UUID,
    "vehicle_label" VARCHAR(120) NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_deleted_at_idx" ON "users"("email", "deleted_at");

-- CreateIndex
CREATE INDEX "users_status_deleted_at_idx" ON "users"("status", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_action_subject_key" ON "permissions"("action", "subject");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_revoked_at_idx" ON "refresh_tokens"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_event_name_created_at_idx" ON "audit_logs"("event_name", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_code_key" ON "service_categories"("code");

-- CreateIndex
CREATE INDEX "service_categories_deleted_at_sort_order_idx" ON "service_categories"("deleted_at", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "service_products_sku_key" ON "service_products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "service_products_slug_key" ON "service_products"("slug");

-- CreateIndex
CREATE INDEX "service_products_category_id_deleted_at_idx" ON "service_products"("category_id", "deleted_at");

-- CreateIndex
CREATE INDEX "service_products_is_active_category_id_deleted_at_idx" ON "service_products"("is_active", "category_id", "deleted_at");

-- CreateIndex
CREATE INDEX "service_products_price_vnd_deleted_at_idx" ON "service_products"("price_vnd", "deleted_at");

-- CreateIndex
CREATE INDEX "service_products_is_featured_booked_count_idx" ON "service_products"("is_featured", "booked_count");

-- CreateIndex
CREATE UNIQUE INDEX "garages_slug_key" ON "garages"("slug");

-- CreateIndex
CREATE INDEX "garages_city_code_verified_deleted_at_idx" ON "garages"("city_code", "verified", "deleted_at");

-- CreateIndex
CREATE INDEX "garages_status_city_code_deleted_at_idx" ON "garages"("status", "city_code", "deleted_at");

-- CreateIndex
CREATE INDEX "garages_is_featured_rating_avg_idx" ON "garages"("is_featured", "rating_avg");

-- CreateIndex
CREATE INDEX "garage_services_service_product_id_is_available_idx" ON "garage_services"("service_product_id", "is_available");

-- CreateIndex
CREATE INDEX "customer_vehicles_user_id_deleted_at_idx" ON "customer_vehicles"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "customer_vehicles_license_plate_idx" ON "customer_vehicles"("license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_is_active_deleted_at_idx" ON "coupons"("code", "is_active", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_order_code_key" ON "bookings"("order_code");

-- CreateIndex
CREATE INDEX "bookings_user_id_created_at_idx" ON "bookings"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "bookings_garage_id_appointment_date_appointment_time_status_idx" ON "bookings"("garage_id", "appointment_date", "appointment_time", "status");

-- CreateIndex
CREATE INDEX "bookings_status_deleted_at_idx" ON "bookings"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "bookings_appointment_date_status_deleted_at_idx" ON "bookings"("appointment_date", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "bookings_payment_status_deleted_at_idx" ON "bookings"("payment_status", "deleted_at");

-- CreateIndex
CREATE INDEX "booking_status_histories_booking_id_created_at_idx" ON "booking_status_histories"("booking_id", "created_at");

-- CreateIndex
CREATE INDEX "booking_items_booking_id_idx" ON "booking_items"("booking_id");

-- CreateIndex
CREATE INDEX "reviews_garage_id_deleted_at_created_at_idx" ON "reviews"("garage_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "reviews_service_product_id_deleted_at_created_at_idx" ON "reviews"("service_product_id", "deleted_at", "created_at");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_products" ADD CONSTRAINT "service_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garages" ADD CONSTRAINT "garages_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_services" ADD CONSTRAINT "garage_services_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_services" ADD CONSTRAINT "garage_services_service_product_id_fkey" FOREIGN KEY ("service_product_id") REFERENCES "service_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "customer_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_histories" ADD CONSTRAINT "booking_status_histories_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_service_product_id_fkey" FOREIGN KEY ("service_product_id") REFERENCES "service_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_service_product_id_fkey" FOREIGN KEY ("service_product_id") REFERENCES "service_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
