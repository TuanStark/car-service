"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  Eye,
  ShoppingBag,
  Star,
  Clock,
  Building2,
} from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { formatVND } from "@/core/formatters/currency";
import type { ServiceProduct } from "../types/service.types";
import { useStore } from "@/features/cart/context/store-context";
import { cn } from "@/core/lib/cn";

interface ServiceProductCardProps {
  readonly product: ServiceProduct;
}

export function ServiceProductCard({ product }: ServiceProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist, openQuickView } = useStore();
  const wished = isInWishlist(product.id);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-xs transition-all duration-200 hover:border-brand/50 hover:shadow-md">
      {/* Product Image Thumbnail */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-subtle">
        <Link
          href={ROUTES.SERVICE_DETAIL(product.slug)}
          className="block h-full w-full"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Top-Left Discount & Commercial Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.discountPercent && (
            <span className="rounded-sm bg-accent px-2 py-0.5 font-mono text-[11px] font-extrabold text-ink-inverse shadow-xs">
              -{product.discountPercent}%
            </span>
          )}
          {product.badge && (
            <span className="rounded-sm border border-line bg-surface/95 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-brand shadow-xs">
              {product.badge}
            </span>
          )}
        </div>

        {/* Top-Right Quick Actions */}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-label="Thêm vào yêu thích"
            title="Yêu thích"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md border shadow-xs transition-colors cursor-pointer",
              wished
                ? "border-accent bg-accent text-ink-inverse"
                : "border-line bg-surface/95 text-ink hover:border-brand hover:text-brand"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", wished && "fill-current")} />
          </button>

          <button
            type="button"
            onClick={() => openQuickView(product)}
            aria-label="Xem nhanh gói dịch vụ"
            title="Xem nhanh"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface/95 text-ink shadow-xs transition-colors hover:border-brand hover:text-brand cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Product Body */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          {/* Category & SKU */}
          <div className="flex items-center justify-between gap-2 text-[11px] text-ink-secondary">
            <Link
              href={`${ROUTES.SERVICES}?danh-muc=${product.categoryId}`}
              className="font-semibold text-brand hover:underline truncate"
            >
              {product.categoryLabel}
            </Link>
            <span className="font-mono text-[10px] text-ink-muted shrink-0">
              {product.sku}
            </span>
          </div>

          {/* Product Title */}
          <h3 className="mt-1.5 line-clamp-2 min-h-[2.6rem] text-sm sm:text-[15px] font-semibold leading-snug text-ink group-hover:text-brand transition-colors">
            <Link href={ROUTES.SERVICE_DETAIL(product.slug)}>
              {product.name}
            </Link>
          </h3>

          {/* Rating & Duration Meta */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-secondary">
            <span className="inline-flex items-center gap-1 text-ink">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <strong>{product.rating.toFixed(1)}</strong>
              <span className="text-ink-muted">({product.bookedCount} đặt)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-brand" />
              {product.estimatedDuration}
            </span>
          </div>
        </div>

        {/* Price Block & Add-To-Cart Button */}
        <div className="mt-4 pt-3.5 border-t border-line">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              {product.originalPriceVnd && (
                <span className="mr-2 text-xs text-ink-muted line-through">
                  {formatVND(product.originalPriceVnd)}
                </span>
              )}
              <strong className="font-display text-2xl font-extrabold tracking-wide text-brand">
                {formatVND(product.priceVnd)}
              </strong>
            </div>
            <span className="text-[10px] text-ink-muted">Giá tham khảo</span>
          </div>

          <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-secondary">
            <Building2 className="h-3 w-3 text-brand" />
            Áp dụng tại {product.supportedGarageIds.length} garage xác minh
          </p>

          <button
            type="button"
            onClick={() => addToCart(product, 1)}
            className="mt-3.5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-brand-soft border border-brand/20 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-brand transition-all hover:bg-brand hover:border-brand hover:text-ink-inverse cursor-pointer"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            THÊM VÀO GIỎ DỊCH VỤ
          </button>
        </div>
      </div>
    </article>
  );
}
