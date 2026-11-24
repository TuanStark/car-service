import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, BadgeCheck, Clock, ArrowRight } from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { Badge } from "@/components/ui/badge";
import { formatStartingVND } from "@/core/formatters/currency";
import type { GarageEntity } from "../types/garage.types";

export function GarageStoreCard({ garage }: { readonly garage: GarageEntity }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-xs transition-all duration-200 hover:border-brand/50 hover:shadow-md">
      <Link
        href={ROUTES.GARAGE_DETAIL(garage.slug)}
        className="relative h-48 w-full overflow-hidden bg-surface-subtle block"
      >
        <Image
          src={garage.coverImage}
          alt={garage.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {garage.verified && (
            <Badge variant="technical">
              <BadgeCheck className="h-3.5 w-3.5 text-brand" />
              Xưởng xác minh
            </Badge>
          )}
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-line bg-surface/95 px-2.5 py-1 text-xs shadow-xs">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <strong className="text-ink">{garage.rating.toFixed(1)}</strong>
          <span className="text-ink-muted">({garage.reviewCount})</span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between text-xs text-brand">
            <span className="inline-flex items-center gap-1 font-semibold">
              <MapPin className="h-3.5 w-3.5" />
              {garage.district}
            </span>
            <span className="font-mono text-[11px] text-ink-muted">
              {garage.bayCount} cầu nâng
            </span>
          </div>

          <h3 className="mt-1.5 font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-ink group-hover:text-brand transition-colors">
            <Link href={ROUTES.GARAGE_DETAIL(garage.slug)}>{garage.name}</Link>
          </h3>

          <p className="mt-1 line-clamp-1 text-xs text-ink-secondary">
            {garage.fullAddress}
          </p>

          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-secondary">
            <Clock className="h-3.5 w-3.5 text-brand" />
            {garage.openHours}
          </p>

          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {garage.availableServices.slice(0, 3).map((srv) => (
              <span
                key={srv}
                className="rounded-sm border border-line bg-surface-subtle px-2 py-0.5 text-[11px] text-ink-secondary"
              >
                {srv}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-3.5">
          <div>
            <span className="block text-[10px] text-ink-muted">
              Dịch vụ từ
            </span>
            <strong className="font-display text-lg font-extrabold text-brand">
              {formatStartingVND(garage.startingPriceVnd)}
            </strong>
          </div>

          <Link
            href={ROUTES.GARAGE_DETAIL(garage.slug)}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 font-display text-xs font-bold uppercase tracking-wider text-ink-inverse transition-colors hover:bg-brand-hover"
          >
            XEM CỬA HÀNG XƯỞNG
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
