import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Check, ArrowRight, Info } from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { catalogService } from "@/features/catalog/services/catalog.service";
import { formatVND } from "@/core/formatters/currency";

export const metadata: Metadata = {
  title: "Bảng giá bảo dưỡng ô tô & Combo tiết kiệm — AUTORA",
  description:
    "Bảng giá dịch vụ bảo dưỡng định kỳ 5.000km, 20.000km, 40.000km và chăm sóc xe ô tô minh bạch bằng VNĐ.",
};

export default function PricingAndCombosPage() {
  const combos = catalogService.getMaintenanceCombos();
  const allProducts = catalogService.getAllProducts();

  return (
    <div className="bg-canvas pb-16">
      <Breadcrumbs items={[{ label: "Bảng giá & Combo" }]} />

      <div className="border-b border-line bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-brand">
              GIÁ RÕ RÀNG • DỊCH VỤ MINH BẠCH
            </span>
            <h1 className="mt-1 font-display text-4xl sm:text-5xl font-extrabold uppercase text-ink">
              BẢNG GIÁ NIÊM YẾT & COMBO THEO MỐC KM
            </h1>
          </div>
          <Badge variant="muted" className="gap-1.5 py-1.5 px-3">
            <Info className="h-3.5 w-3.5 text-brand" />
            Giá tham khảo (Dữ liệu Demo minh họa)
          </Badge>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8 space-y-14">
        {/* 3 Milestone Combos */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className={
                combo.recommended
                  ? "flex flex-col justify-between rounded-xl border-2 border-brand bg-surface p-7 shadow-md relative"
                  : "flex flex-col justify-between rounded-xl border border-line bg-surface p-7 shadow-xs"
              }
            >
              {combo.recommended && (
                <span className="absolute right-4 top-4 rounded-sm bg-accent px-2.5 py-0.5 font-mono text-[10px] font-extrabold uppercase text-ink-inverse">
                  ĐƯỢC CHỌN NHIỀU NHẤT
                </span>
              )}

              <div>
                <span className="font-mono text-xs font-bold text-brand">
                  {combo.code}
                </span>
                <h2 className="mt-2 font-display text-3xl font-extrabold uppercase text-ink">
                  {combo.title}
                </h2>
                <p className="mt-1.5 text-xs text-ink-secondary leading-relaxed">
                  {combo.subtitle}
                </p>

                <div className="my-5 border-y border-line py-4">
                  <span className="text-xs text-ink-muted line-through mr-2">
                    {formatVND(combo.originalPriceVnd)}
                  </span>
                  <strong className="font-display text-4xl font-extrabold text-brand">
                    {formatVND(combo.priceVnd)}
                  </strong>
                  <span className="block text-[11px] text-ink-secondary mt-1">
                    Giá tham khảo trọn gói • Thực hiện: {combo.duration}
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {combo.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-xs text-ink"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant={combo.recommended ? "accent" : "primary"}
                size="lg"
                asChild
                className="mt-7 w-full"
              >
                <Link href={ROUTES.SERVICE_DETAIL(combo.linkedProductSlug)}>
                  XEM & ĐẶT COMBO NÀY
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </section>

        {/* Full Reference Price Comparison Table */}
        <section className="space-y-4">
          <h2 className="font-display text-3xl font-extrabold uppercase text-ink">
            BIỂU PHÍ CHI TIẾT TỪNG HẠNG MỤC DỊCH VỤ
          </h2>

          <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-surface-subtle font-mono text-xs uppercase text-ink">
                <tr>
                  <th className="px-4 py-3.5">Mã SKU</th>
                  <th className="px-4 py-3.5">Tên gói dịch vụ</th>
                  <th className="px-4 py-3.5">Danh mục</th>
                  <th className="px-4 py-3.5">Thời gian</th>
                  <th className="px-4 py-3.5">Giá tham khảo</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {allProducts.map((prd) => (
                  <tr
                    key={prd.id}
                    className="hover:bg-surface-subtle/50 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-ink-muted">
                      {prd.sku}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink">
                      <Link
                        href={ROUTES.SERVICE_DETAIL(prd.slug)}
                        className="hover:text-brand"
                      >
                        {prd.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink-secondary">
                      {prd.categoryLabel}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink-secondary">
                      {prd.estimatedDuration}
                    </td>
                    <td className="px-4 py-3.5 font-display text-lg font-extrabold text-brand">
                      từ {formatVND(prd.priceVnd)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={ROUTES.SERVICE_DETAIL(prd.slug)}
                        className="inline-block rounded-md border border-brand/35 bg-brand-soft px-3 py-1.5 text-xs font-bold uppercase text-brand hover:bg-brand hover:text-ink-inverse transition-colors"
                      >
                        Chọn gói
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
