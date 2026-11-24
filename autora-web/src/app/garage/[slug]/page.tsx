import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  Clock,
  Star,
  BadgeCheck,
  Quote,
  CalendarCheck2,
} from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { garageService } from "@/features/garages/services/garage.service";
import { catalogService } from "@/features/catalog/services/catalog.service";
import { ServiceProductCard } from "@/features/catalog/components/service-product-card";
import { formatStartingVND } from "@/core/formatters/currency";

export function generateStaticParams() {
  return garageService.getAllGarages().map((g) => ({ slug: g.slug }));
}

export default async function GarageVendorStorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const garage = garageService.getGarageBySlug(slug);

  if (!garage) {
    notFound();
  }

  const garageProducts = catalogService.getProductsByGarageId(garage.id);

  return (
    <div className="bg-canvas pb-16">
      <Breadcrumbs
        items={[
          { label: "Hệ thống Garage", href: ROUTES.GARAGES },
          { label: garage.name },
        ]}
      />

      {/* Vendor Storefront Hero Header */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <div className="relative h-64 sm:h-80 w-full bg-surface-subtle">
            <Image
              src={garage.coverImage}
              alt={garage.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

            <div className="absolute bottom-5 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="solidAccent">GIAN HÀNG ĐỐI TÁC XÁC MINH</Badge>
                  <Badge variant="technical">{garage.bayCount} CẦU NÂNG</Badge>
                </div>
                <h1 className="mt-2 font-display text-3xl sm:text-5xl font-extrabold uppercase text-white">
                  {garage.name}
                </h1>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-line bg-surface/95 px-4 py-2 text-sm shadow-xs">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <strong className="text-ink">
                  {garage.rating.toFixed(1)} / 5.0
                </strong>
                <span className="text-xs text-ink-secondary">
                  ({garage.reviewCount} đánh giá)
                </span>
              </div>
            </div>
          </div>

          {/* Store Info Strip */}
          <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-12 border-t border-line">
            <div className="lg:col-span-8 space-y-4">
              <p className="text-sm leading-relaxed text-ink-secondary">
                {garage.summary}
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs text-ink-secondary">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-ink">{garage.fullAddress}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-ink">{garage.openHours}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {garage.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-subtle px-3 py-1 text-xs font-medium text-ink"
                  >
                    <BadgeCheck className="h-3.5 w-3.5 text-brand" />
                    {cert}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-between rounded-lg border border-line bg-surface-subtle/60 p-5">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-brand">
                  Đánh giá mới nhất
                </span>
                <p className="mt-2 text-xs italic text-ink leading-relaxed">
                  <Quote className="inline h-3.5 w-3.5 text-brand mr-1" />
                  {garage.latestReview.comment}
                </p>
                <span className="mt-2 block text-[11px] text-ink-secondary">
                  — {garage.latestReview.author} ({garage.latestReview.vehicle})
                </span>
              </div>

              <Button variant="accent" size="md" asChild className="mt-4 w-full">
                <Link href={ROUTES.CHECKOUT}>
                  <CalendarCheck2 className="h-4 w-4" />
                  ĐẶT LỊCH HẸN TẠI XƯỞNG NÀY
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Sold by This Garage */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-brand">
              DANH MỤC NIÊM YẾT TẠI XƯỞNG
            </span>
            <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-ink">
              GÓI DỊCH VỤ ÁP DỤNG ({garageProducts.length})
            </h2>
          </div>
          <span className="text-xs text-ink-secondary">
            Mức giá khởi điểm: {formatStartingVND(garage.startingPriceVnd)}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {garageProducts.map((product) => (
            <ServiceProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
