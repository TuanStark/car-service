"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  Star,
  Clock,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/config/routes.config";
import { formatVND } from "@/core/formatters/currency";
import { garageService } from "@/features/garages/services/garage.service";
import { useStore } from "@/features/cart/context/store-context";

export function QuickViewModal() {
  const { quickViewProduct, closeQuickView, addToCart } = useStore();
  const [selectedGarageId, setSelectedGarageId] = useState<string>("");

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const garages = product.supportedGarageIds
    .map((id) => garageService.getGarageById(id))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const effectiveGarageId = selectedGarageId || garages[0]?.id;

  return (
    <Dialog
      open={Boolean(quickViewProduct)}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedGarageId("");
          closeQuickView();
        }
      }}
    >
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left Image */}
          <div className="relative min-h-[260px] md:col-span-5 bg-surface-subtle">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 360px"
              className="object-cover"
            />
            {product.discountPercent && (
              <span className="absolute left-4 top-4 rounded-sm bg-accent px-2.5 py-1 font-mono text-xs font-extrabold text-ink-inverse shadow-xs">
                -{product.discountPercent}%
              </span>
            )}
          </div>

          {/* Right Product Quick Details */}
          <div className="p-6 sm:p-7 md:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">{product.categoryLabel}</Badge>
              <span className="font-mono text-xs text-ink-muted">
                Mã: {product.sku}
              </span>
            </div>

            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl leading-tight">
                {product.name}
              </DialogTitle>
              <DialogDescription className="pt-1 text-xs">
                {product.shortSummary}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary">
              <span className="inline-flex items-center gap-1 text-ink">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <strong>{product.rating.toFixed(1)}</strong> ({product.reviewCount} đánh giá)
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-brand" />
                {product.estimatedDuration}
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                {product.warrantyLabel}
              </span>
            </div>

            {/* Price */}
            <div className="border-y border-line py-3 flex items-baseline gap-3">
              <strong className="font-display text-3xl font-extrabold text-brand">
                {formatVND(product.priceVnd)}
              </strong>
              {product.originalPriceVnd && (
                <span className="text-sm text-ink-muted line-through">
                  {formatVND(product.originalPriceVnd)}
                </span>
              )}
              <span className="ml-auto text-[11px] text-ink-muted">
                Giá tham khảo
              </span>
            </div>

            {/* Steps */}
            <ul className="space-y-1.5">
              {product.includedSteps.slice(0, 3).map((step) => (
                <li
                  key={step}
                  className="flex items-start gap-2 text-xs text-ink-secondary"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>

            {/* Garage Picker */}
            {garages.length > 0 && (
              <div className="space-y-1">
                <label
                  htmlFor="qv-garage"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-ink-secondary"
                >
                  Chọn garage thực hiện dự kiến
                </label>
                <select
                  id="qv-garage"
                  value={effectiveGarageId}
                  onChange={(e) => setSelectedGarageId(e.target.value)}
                  className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-xs text-ink focus:border-brand focus:outline-none"
                >
                  {garages.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.district})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2.5 sm:flex-row pt-2">
              <Button
                variant="accent"
                size="md"
                className="flex-1"
                onClick={() => {
                  closeQuickView();
                  addToCart(product, 1, effectiveGarageId, true);
                }}
              >
                <ShoppingBag className="h-4 w-4" />
                THÊM VÀO GIỎ DỊCH VỤ
              </Button>
              <Button
                variant="secondary"
                size="md"
                asChild
                onClick={closeQuickView}
              >
                <Link href={ROUTES.SERVICE_DETAIL(product.slug)}>
                  Chi tiết
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
