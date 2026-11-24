"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Star,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ShoppingBag,
  Heart,
  MapPin,
  Plus,
  Minus,
  Car,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/core/formatters/currency";
import type { ServiceProduct } from "../types/service.types";
import type { GarageEntity } from "@/features/garages/types/garage.types";
import { useStore } from "@/features/cart/context/store-context";
import { ServiceProductCard } from "./service-product-card";
import { cn } from "@/core/lib/cn";

interface ProductDetailClientProps {
  readonly product: ServiceProduct;
  readonly supportedGarages: readonly GarageEntity[];
  readonly relatedProducts: readonly ServiceProduct[];
}

export function ProductDetailClient({
  product,
  supportedGarages,
  relatedProducts,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useStore();

  const [activeImage, setActiveImage] = useState(product.image);
  const [quantity, setQuantity] = useState(1);
  const [selectedGarageId, setSelectedGarageId] = useState(
    supportedGarages[0]?.id ?? ""
  );
  const [activeTab, setActiveTab] = useState<"steps" | "specs" | "garages">(
    "steps"
  );

  const wished = isInWishlist(product.id);

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedGarageId, false);
    router.push(ROUTES.CHECKOUT);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* TOP PDP COMMERCIAL SUMMARY */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 rounded-xl border border-line bg-surface p-6 sm:p-8 shadow-xs">
        {/* Left 5 Cols: Image Gallery */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-line bg-surface-subtle">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
            />
            {product.discountPercent && (
              <span className="absolute left-4 top-4 rounded-sm bg-accent px-3 py-1 font-mono text-xs font-extrabold text-ink-inverse shadow-xs">
                GIẢM {product.discountPercent}%
              </span>
            )}
          </div>

          {product.gallery.length > 1 && (
            <div className="flex gap-3">
              {product.gallery.map((img) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={cn(
                    "relative h-20 w-24 overflow-hidden rounded-md border bg-surface-subtle cursor-pointer",
                    activeImage === img
                      ? "border-brand ring-2 ring-brand/20"
                      : "border-line opacity-70 hover:opacity-100"
                  )}
                >
                  <Image
                    src={img}
                    alt={product.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right 7 Cols: E-Commerce Purchase & Booking Box */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="default">{product.categoryLabel}</Badge>
            <span className="font-mono text-xs text-ink-secondary">
              SKU: <strong className="text-ink">{product.sku}</strong>
            </span>
            <span className="text-ink-muted">•</span>
            <span className="inline-flex items-center gap-1 text-xs text-ink">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <strong>{product.rating.toFixed(1)}</strong> ({product.reviewCount} đánh giá • {product.bookedCount} lượt đặt)
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase leading-tight text-ink">
            {product.name}
          </h1>

          <p className="text-sm leading-relaxed text-ink-secondary">
            {product.description}
          </p>

          {/* Price Box */}
          <div className="rounded-lg border border-line bg-surface-subtle/60 p-5">
            <div className="flex flex-wrap items-baseline gap-3">
              <strong className="font-display text-4xl font-extrabold text-brand">
                {formatVND(product.priceVnd)}
              </strong>
              {product.originalPriceVnd && (
                <span className="text-base text-ink-muted line-through">
                  {formatVND(product.originalPriceVnd)}
                </span>
              )}
              <Badge variant="muted" className="ml-auto">
                Giá tham khảo trọn gói
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 border-t border-line pt-3 text-xs text-ink">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-brand" />
                Thời gian: {product.estimatedDuration}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                {product.warrantyLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-brand" />
                Đa dòng xe phổ thông
              </span>
            </div>
          </div>

          {/* Compatible Vehicles */}
          <div className="text-xs text-ink-secondary">
            <strong className="text-ink">Dòng xe tương thích: </strong>
            {product.compatibleBrandsLabel}
          </div>

          {/* Select Workshop Location */}
          <div className="space-y-2">
            <label
              htmlFor="pdp-garage-select"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink"
            >
              <MapPin className="h-3.5 w-3.5 text-brand" />
              Chọn garage thực hiện dịch vụ ({supportedGarages.length} chi nhánh)
            </label>
            <select
              id="pdp-garage-select"
              value={selectedGarageId}
              onChange={(e) => setSelectedGarageId(e.target.value)}
              className="h-11 w-full rounded-md border border-line-strong bg-surface px-4 text-sm text-ink focus:border-brand focus:outline-none"
            >
              {supportedGarages.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.fullAddress}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity + Add to Cart + Buy Now */}
          <div className="flex flex-wrap items-stretch gap-3 pt-2">
            <div className="inline-flex items-center rounded-md border border-line-strong bg-surface">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Giảm số lượng"
                className="flex h-12 w-10 items-center justify-center text-ink-secondary hover:text-ink cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-mono text-sm font-bold text-ink">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Tăng số lượng"
                className="flex h-12 w-10 items-center justify-center text-ink-secondary hover:text-ink cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                addToCart(product, quantity, selectedGarageId, true)
              }
              className="flex-1 min-w-[200px]"
            >
              <ShoppingBag className="h-4 w-4" />
              THÊM VÀO GIỎ DỊCH VỤ
            </Button>

            <Button
              variant="accent"
              size="lg"
              onClick={handleBuyNow}
              className="flex-1 min-w-[180px]"
            >
              <Zap className="h-4 w-4" />
              ĐẶT LỊCH NGAY
            </Button>

            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label="Lưu yêu thích"
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-md border cursor-pointer transition-colors",
                wished
                  ? "border-accent bg-accent text-ink-inverse"
                  : "border-line-strong bg-surface text-ink hover:border-brand hover:text-brand"
              )}
            >
              <Heart className={cn("h-5 w-5", wished && "fill-current")} />
            </button>
          </div>
        </div>
      </div>

      {/* MIDDLE PDP TABS */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
        <div className="flex flex-wrap border-b border-line bg-surface-subtle/70">
          {[
            { id: "steps", label: "Chi tiết quy trình thực hiện" },
            { id: "specs", label: "Thông số kỹ thuật & Bảo hành" },
            {
              id: "garages",
              label: `Garage áp dụng (${supportedGarages.length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(tab.id as "steps" | "specs" | "garages")
              }
              className={cn(
                "px-6 py-4 font-display text-sm sm:text-base font-bold uppercase tracking-wider transition-colors cursor-pointer",
                activeTab === tab.id
                  ? "border-b-2 border-brand bg-surface text-brand"
                  : "text-ink-secondary hover:text-ink"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === "steps" && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold uppercase text-ink">
                Các hạng mục công việc bao gồm trong gói
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {product.includedSteps.map((step, idx) => (
                  <div
                    key={step}
                    className="flex items-start gap-3 rounded-lg border border-line bg-surface-subtle/50 p-4"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-brand font-mono text-xs font-bold text-ink-inverse">
                      0{idx + 1}
                    </span>
                    <span className="text-sm text-ink leading-relaxed">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="max-w-2xl divide-y divide-line rounded-lg border border-line bg-surface-subtle/40">
              {product.specifications.map((spec) => (
                <div
                  key={spec.label}
                  className="grid grid-cols-1 sm:grid-cols-3 px-4 py-3 text-sm gap-1"
                >
                  <span className="text-ink-secondary">{spec.label}</span>
                  <strong className="sm:col-span-2 text-ink">
                    {spec.value}
                  </strong>
                </div>
              ))}
            </div>
          )}

          {activeTab === "garages" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {supportedGarages.map((g) => (
                <div
                  key={g.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-line bg-surface-subtle/40 p-4"
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-brand">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{g.district}</span>
                    </div>
                    <strong className="mt-1 block font-display text-lg uppercase text-ink">
                      {g.name}
                    </strong>
                    <p className="mt-1 text-xs text-ink-secondary">
                      {g.fullAddress}
                    </p>
                    <p className="mt-1 text-xs text-ink-secondary">
                      {g.openHours}
                    </p>
                  </div>
                  <Link
                    href={ROUTES.GARAGE_DETAIL(g.slug)}
                    className="shrink-0 rounded-md border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-brand hover:border-brand"
                  >
                    Xem xưởng
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      <section className="space-y-5">
        <h2 className="font-display text-3xl font-extrabold uppercase text-ink">
          DỊCH VỤ THƯỜNG ĐƯỢC ĐẶT KÈM
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {relatedProducts.map((rel) => (
            <ServiceProductCard key={rel.id} product={rel} />
          ))}
        </div>
      </section>
    </div>
  );
}
