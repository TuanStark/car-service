import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ShopCatalogClient } from "@/features/catalog/components/shop-catalog-client";

export const metadata: Metadata = {
  title: "Cửa hàng dịch vụ & Bảo dưỡng ô tô — AUTORA Việt Nam",
  description:
    "Danh mục gói bảo dưỡng định kỳ, sửa chữa kỹ thuật, chăm sóc detailing và lốp ô tô với giá VNĐ minh bạch.",
};

export default function ServicesShopPage() {
  return (
    <div className="bg-canvas pb-16">
      <Breadcrumbs items={[{ label: "Cửa hàng dịch vụ" }]} />

      <div className="border-b border-line bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-brand">
            NIÊM YẾT MINH BẠCH • CHỌN XƯỞNG LINH HOẠT
          </span>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl font-extrabold uppercase text-ink">
            CỬA HÀNG DỊCH VỤ & PHỤ TÙNG LẮP ĐẶT
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
            Lọc nhanh gói dịch vụ phù hợp dòng xe của bạn, so sánh hạng mục kỹ thuật đi kèm và đặt lịch trực tuyến không cần đặt cọc.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-12 text-sm text-ink-secondary">
            Đang tải danh mục dịch vụ...
          </div>
        }
      >
        <ShopCatalogClient />
      </Suspense>
    </div>
  );
}
