"use client";

import React, { useState } from "react";
import { Search, MapPin, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { garageService } from "@/features/garages/services/garage.service";
import { catalogService } from "@/features/catalog/services/catalog.service";
import type { ServiceCategoryId } from "@/features/catalog/types/service.types";
import type { CityCode } from "@/features/garages/types/garage.types";
import { GarageStoreCard } from "@/features/garages/components/garage-store-card";
import { cn } from "@/core/lib/cn";

export function GarageDirectoryClient() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<CityCode>("all");
  const [category, setCategory] = useState<ServiceCategoryId | "all">("all");

  const cities = garageService.getCities();
  const categories = catalogService.getAllCategories();

  const filtered = garageService.filterGarages({ query, city, category });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Sidebar */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="rounded-lg border border-line bg-surface p-5 shadow-xs space-y-5">
            <h2 className="font-display text-lg font-bold uppercase text-ink border-b border-line pb-3">
              Bộ lọc chi nhánh xưởng
            </h2>

            <div className="space-y-1.5">
              <label
                htmlFor="dir-search"
                className="block text-xs font-semibold uppercase text-ink-secondary"
              >
                Tên xưởng / Quận huyện
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
                <Input
                  id="dir-search"
                  data-agent-target="garage.filter.search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Quận 7, Cầu Giấy, Hải Châu..."
                  className="h-10 pl-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5 border-t border-line pt-4">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase text-ink-secondary">
                <MapPin className="h-3.5 w-3.5 text-brand" />
                Tỉnh / Thành phố
              </span>
              <div className="flex flex-col gap-1">
                {cities.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    data-agent-target={`garage.filter.city.${c.code}`}
                    onClick={() => setCity(c.code)}
                    className={cn(
                      "rounded-md px-3 py-2 text-left text-xs font-medium cursor-pointer transition-colors",
                      city === c.code
                        ? "bg-brand font-bold text-ink-inverse"
                        : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 border-t border-line pt-4">
              <span className="block text-xs font-semibold uppercase text-ink-secondary">
                Chuyên môn kỹ thuật
              </span>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  data-agent-target="garage.filter.category.all"
                  onClick={() => setCategory("all")}
                  className={cn(
                    "rounded-md px-3 py-2 text-left text-xs font-medium cursor-pointer",
                    category === "all"
                      ? "bg-brand-soft text-brand font-bold"
                      : "text-ink-secondary hover:text-ink"
                  )}
                >
                  Tất cả chuyên môn
                </button>
                {categories.slice(0, 4).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    data-agent-target={`garage.filter.category.${cat.id}`}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "rounded-md px-3 py-2 text-left text-xs font-medium cursor-pointer",
                      category === cat.id
                        ? "bg-brand-soft text-brand font-bold"
                        : "text-ink-secondary hover:text-ink"
                    )}
                  >
                    {cat.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Garage Cards */}
        <div className="lg:col-span-9 space-y-5">
          <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3 text-xs text-ink-secondary shadow-xs">
            <span>
              Tìm thấy <strong className="text-ink">{filtered.length}</strong>{" "}
              trung tâm dịch vụ đã xác minh (Dữ liệu Demo)
            </span>
            {(query || city !== "all" || category !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCity("all");
                  setCategory("all");
                }}
                className="inline-flex items-center gap-1 font-semibold text-accent hover:underline cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Xóa bộ lọc
              </button>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filtered.map((g) => (
                <GarageStoreCard key={g.id} garage={g} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-surface p-12 text-center shadow-xs">
              <p className="font-display text-2xl font-bold uppercase text-ink">
                Không tìm thấy garage phù hợp
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => {
                  setQuery("");
                  setCity("all");
                  setCategory("all");
                }}
              >
                HIỂN THỊ TẤT CẢ GARAGE
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
