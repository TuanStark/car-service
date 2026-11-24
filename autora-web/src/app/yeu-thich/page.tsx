"use client";

import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { catalogService } from "@/features/catalog/services/catalog.service";
import { ServiceProductCard } from "@/features/catalog/components/service-product-card";
import { useStore } from "@/features/cart/context/store-context";

export default function WishlistPage() {
  const { wishlistIds } = useStore();
  const products = catalogService
    .getAllProducts()
    .filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="bg-canvas pb-16">
      <Breadcrumbs items={[{ label: "Dịch vụ yêu thích" }]} />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-extrabold uppercase text-ink border-b border-line pb-4">
          DANH SÁCH DỊCH VỤ ĐÃ LƯU ({products.length})
        </h1>

        {products.length === 0 ? (
          <div className="mt-8 rounded-xl border border-line bg-surface py-16 px-6 text-center shadow-xs">
            <Heart className="mx-auto h-12 w-12 text-ink-muted/40" />
            <p className="mt-4 font-display text-2xl font-bold uppercase text-ink">
              Chưa có gói dịch vụ yêu thích nào
            </p>
            <Button variant="primary" asChild className="mt-6">
              <Link href={ROUTES.SERVICES}>KHÁM PHÁ CỬA HÀNG DỊCH VỤ</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((prd) => (
              <ServiceProductCard key={prd.id} product={prd} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
