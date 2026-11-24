"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, RotateCcw, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { catalogService } from "../services/catalog.service";
import type {
  CatalogSortBy,
  ServiceCategoryId,
  VehicleBodyType,
} from "../types/service.types";
import { ServiceProductCard } from "./service-product-card";
import { cn } from "@/core/lib/cn";

export function ShopCatalogClient() {
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const initialCategory =
    (searchParams.get("danh-muc") as ServiceCategoryId | null) ?? "all";
  const initialVehicle =
    (searchParams.get("loai-xe") as VehicleBodyType | null) ?? "all";
  const initialPrice =
    (searchParams.get("muc-gia") as
      | "all"
      | "under-500k"
      | "500k-1500k"
      | "over-1500k"
      | null) ?? "all";

  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState<ServiceCategoryId | "all">(
    initialCategory
  );
  const [priceRange, setPriceRange] = useState<
    "all" | "under-500k" | "500k-1500k" | "over-1500k"
  >(initialPrice);
  const [vehicleType, setVehicleType] =
    useState<VehicleBodyType>(initialVehicle);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [sortBy, setSortBy] = useState<CatalogSortBy>("popular");

  const categories = catalogService.getAllCategories();

  const filteredProducts = catalogService.filterProducts({
    query,
    categoryId,
    priceRange,
    vehicleType,
    onlyDiscounted,
    sortBy,
  });

  const resetAll = () => {
    setQuery("");
    setCategoryId("all");
    setPriceRange("all");
    setVehicleType("all");
    setOnlyDiscounted(false);
    setSortBy("popular");
  };

  const hasFilters =
    query.trim() !== "" ||
    categoryId !== "all" ||
    priceRange !== "all" ||
    vehicleType !== "all" ||
    onlyDiscounted;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT SIDEBAR: Light Layered Filters */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="rounded-lg border border-line bg-surface p-5 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="inline-flex items-center gap-2 font-display text-lg font-bold uppercase text-ink">
                <SlidersHorizontal className="h-4 w-4 text-brand" />
                Bộ lọc sản phẩm
              </span>
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Đặt lại
                </button>
              )}
            </div>

            {/* Keyword Filter */}
            <div className="space-y-2">
              <label
                htmlFor="shop-keyword"
                className="block font-display text-sm font-bold uppercase tracking-wider text-ink"
              >
                Từ khóa / Mã dịch vụ
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
                <Input
                  id="shop-keyword"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="VD: thay dầu, ceramic..."
                  className="h-10 pl-9 text-xs"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2 border-t border-line pt-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink">
                Danh mục dịch vụ
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => setCategoryId("all")}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs transition-colors cursor-pointer",
                      categoryId === "all"
                        ? "bg-brand font-bold text-ink-inverse"
                        : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
                    )}
                  >
                    <span>Tất cả hạng mục</span>
                    <span className="font-mono">
                      {catalogService.getAllProducts().length}
                    </span>
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs transition-colors cursor-pointer",
                        categoryId === cat.id
                          ? "bg-brand font-bold text-ink-inverse"
                          : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
                      )}
                    >
                      <span>{cat.shortLabel}</span>
                      <span className="font-mono">{cat.packageCount}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Filter */}
            <div className="space-y-2 border-t border-line pt-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink">
                Khoảng giá tham khảo
              </h3>
              <div className="space-y-1.5 text-xs">
                {[
                  { id: "all", label: "Tất cả mức giá" },
                  { id: "under-500k", label: "Dưới 500.000đ" },
                  { id: "500k-1500k", label: "500.000đ – 1.500.000đ" },
                  { id: "over-1500k", label: "Trên 1.500.000đ" },
                ].map((pr) => (
                  <label
                    key={pr.id}
                    className="flex items-center gap-2.5 py-1 text-ink-secondary hover:text-ink cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="price-range"
                      checked={priceRange === pr.id}
                      onChange={() =>
                        setPriceRange(
                          pr.id as
                            | "all"
                            | "under-500k"
                            | "500k-1500k"
                            | "over-1500k"
                        )
                      }
                      className="accent-brand"
                    />
                    <span>{pr.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Vehicle Type Filter */}
            <div className="space-y-2 border-t border-line pt-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink">
                Kiểu dáng xe tương thích
              </h3>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { id: "all", label: "Tất cả xe" },
                  { id: "sedan", label: "Sedan" },
                  { id: "suv", label: "CUV / SUV" },
                  { id: "mpv", label: "MPV / Bán tải" },
                  { id: "ev", label: "Xe điện" },
                ].map((vt) => (
                  <button
                    key={vt.id}
                    type="button"
                    onClick={() => setVehicleType(vt.id as VehicleBodyType)}
                    className={cn(
                      "rounded-md border px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors",
                      vehicleType === vt.id
                        ? "border-brand bg-brand-soft text-brand font-bold"
                        : "border-line bg-surface-subtle/50 text-ink-secondary hover:text-ink"
                    )}
                  >
                    {vt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Promotion Toggle */}
            <div className="border-t border-line pt-4">
              <label className="flex items-center gap-2.5 text-xs font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyDiscounted}
                  onChange={(e) => setOnlyDiscounted(e.target.checked)}
                  className="accent-brand h-4 w-4"
                />
                <Tag className="h-3.5 w-3.5 text-accent" />
                <span>Chỉ hiện gói đang giảm giá</span>
              </label>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <div className="lg:col-span-9 space-y-5">
          {/* Shop Top Toolbar */}
          <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface px-4 py-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs sm:text-sm text-ink-secondary">
              Hiển thị{" "}
              <strong className="text-ink">{filteredProducts.length}</strong>{" "}
              gói dịch vụ & phụ tùng chính hãng
            </p>

            <div className="flex items-center gap-2.5">
              <label
                htmlFor="shop-sort"
                className="text-xs text-ink-secondary shrink-0"
              >
                Sắp xếp theo:
              </label>
              <select
                id="shop-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as CatalogSortBy)}
                className="h-9 rounded-md border border-line-strong bg-surface px-3 text-xs font-medium text-ink focus:border-brand focus:outline-none"
              >
                <option value="popular">Đặt nhiều nhất</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
                <option value="discount">Mức giảm giá tốt nhất</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ServiceProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-surface p-12 text-center shadow-xs">
              <p className="font-display text-2xl font-bold uppercase text-ink">
                Không tìm thấy gói dịch vụ phù hợp
              </p>
              <p className="mt-2 text-xs text-ink-secondary">
                Hãy thử nới rộng khoảng giá hoặc đặt lại bộ lọc danh mục bên trái.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={resetAll}
                className="mt-5"
              >
                XÓA TẤT CẢ BỘ LỌC
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
