"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Phone,
  Clock,
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  Car,
  MapPin,
  CalendarCheck2,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import { SITE_CONFIG } from "@/config/site.config";
import { ROUTES } from "@/config/routes.config";
import { catalogService } from "@/features/catalog/services/catalog.service";
import { formatVND, formatStartingVND } from "@/core/formatters/currency";
import { useStore } from "@/features/cart/context/store-context";
import { cn } from "@/core/lib/cn";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    cartCount,
    totalVnd,
    wishlistIds,
    activeVehicle,
    orders,
    setMiniCartOpen,
    toastMessage,
  } = useStore();

  const categories = catalogService.getAllCategories();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [isCatMenuOpen, setIsCatMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (searchCategory !== "all") params.set("danh-muc", searchCategory);
    const qs = params.toString();
    router.push(qs ? `${ROUTES.SERVICES}?${qs}` : ROUTES.SERVICES);
    setIsMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-surface border-b border-line shadow-xs">
      {/* Global Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-brand/30 bg-surface px-4 py-3 text-xs sm:text-sm font-medium text-ink shadow-xl flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TIER 1: Top Utility Bar (Deep Steel Teal) */}
      <div className="hidden lg:block bg-brand text-ink-inverse/90 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center divide-x divide-white/20">
            <span className="pr-4 inline-flex items-center gap-1.5 text-white">
              <Phone className="h-3.5 w-3.5 text-amber-300" />
              Hotline kỹ thuật: <strong>{SITE_CONFIG.hotline}</strong>
            </span>
            <span className="px-4 inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-300" />
              {SITE_CONFIG.workingHours}
            </span>
            <span className="pl-4 text-white">
              Ưu đãi đặt online: Nhập mã{" "}
              <strong className="font-mono text-amber-300">AUTORA10</strong>{" "}
              giảm 10% gói dịch vụ
            </span>
          </div>

          <div className="flex items-center divide-x divide-white/20">
            <Link
              href={ROUTES.GARAGES}
              className="pr-3.5 inline-flex items-center gap-1 text-white/95 hover:text-amber-300 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-amber-300" />
              TP.HCM • Hà Nội • Đà Nẵng
            </Link>
            <Link
              href={ROUTES.ACCOUNT}
              className="px-3.5 text-white/95 hover:text-amber-300 transition-colors"
            >
              Tra cứu lịch hẹn ({orders.length})
            </Link>
            <span className="pl-3.5 font-mono text-[11px] text-white">
              Tiếng Việt • VNĐ
            </span>
          </div>
        </div>
      </div>

      {/* TIER 2: Main Clean White E-Commerce Header */}
      <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 lg:gap-8">
          {/* Logo */}
          <Link
            href={ROUTES.HOME}
            className="flex shrink-0 items-center gap-3 focus:outline-none"
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-ink-inverse shadow-xs">
              <span className="font-display text-2xl font-extrabold leading-none">
                A
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" />
            </span>
            <div>
              <span className="block font-display text-2xl sm:text-3xl font-extrabold tracking-[0.08em] text-ink leading-none">
                AUTORA
              </span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-ink-secondary mt-0.5">
                AUTO SERVICE MARKET
              </span>
            </div>
          </Link>

          {/* E-Commerce Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-2xl items-stretch overflow-hidden rounded-lg border border-line-strong bg-surface-subtle/60 focus-within:border-brand focus-within:bg-surface focus-within:ring-2 focus-within:ring-brand/15 transition-all"
          >
            <div className="relative hidden xl:flex items-center border-r border-line bg-surface-subtle">
              <select
                aria-label="Chọn danh mục tìm kiếm"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="h-11 appearance-none bg-transparent pl-3.5 pr-8 text-xs font-semibold text-ink focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.shortLabel}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-ink-secondary" />
            </div>

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm gói bảo dưỡng, thay dầu, phủ ceramic, mã ATR-BD-001..."
              className="h-11 flex-1 bg-transparent px-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />

            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="inline-flex items-center gap-2 bg-brand px-5 font-display text-sm font-bold uppercase tracking-wider text-ink-inverse transition-colors hover:bg-brand-hover cursor-pointer"
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">Tìm kiếm</span>
            </button>
          </form>

          {/* Right E-Commerce Utility Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active Vehicle Pill */}
            <Link
              href={ROUTES.ACCOUNT}
              className="hidden xl:flex items-center gap-2.5 rounded-lg border border-line bg-surface-subtle/70 px-3 py-2 text-left transition-colors hover:border-brand/50 hover:bg-brand-soft/40"
              title="Quản lý xe của bạn"
            >
              <Car className="h-4 w-4 shrink-0 text-brand" />
              <div className="leading-tight">
                <span className="block text-[10px] uppercase tracking-wider text-ink-secondary">
                  Xe của tôi
                </span>
                <strong className="block text-xs text-ink max-w-[110px] truncate">
                  {activeVehicle.brand} {activeVehicle.model.split(" ")[0]}
                </strong>
              </div>
            </Link>

            {/* Account Link */}
            <Link
              href={ROUTES.ACCOUNT}
              className="hidden sm:flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink hover:bg-surface-subtle hover:text-brand transition-colors"
            >
              <User className="h-5 w-5 text-brand" />
              <div className="hidden lg:block leading-tight">
                <span className="block text-[10px] text-ink-secondary">
                  Đăng nhập
                </span>
                <strong className="block text-xs">Tài khoản</strong>
              </div>
            </Link>

            {/* Wishlist Link */}
            <Link
              href={ROUTES.WISHLIST}
              aria-label="Danh sách yêu thích"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ink transition-colors hover:border-brand hover:text-brand"
            >
              <Heart className="h-4 w-4" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 font-mono text-[10px] font-bold text-ink-inverse">
                {wishlistIds.length}
              </span>
            </Link>

            {/* Cart Trigger */}
            <button
              type="button"
              onClick={() => setMiniCartOpen(true)}
              className="flex items-center gap-2.5 rounded-lg border border-brand/25 bg-brand-soft/60 px-3 py-2 text-left transition-colors hover:bg-brand-soft cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="h-5 w-5 text-brand" />
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-extrabold text-ink-inverse">
                  {cartCount}
                </span>
              </div>
              <div className="hidden sm:block leading-tight">
                <span className="block text-[10px] text-ink-secondary">
                  Giỏ dịch vụ
                </span>
                <strong className="block font-mono text-xs text-brand font-bold">
                  {formatVND(totalVnd)}
                </strong>
              </div>
            </button>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileOpen((v) => !v)}
              aria-label="Mở menu điều hướng"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ink lg:hidden"
            >
              {isMobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-3 flex md:hidden overflow-hidden rounded-lg border border-line-strong bg-surface-subtle/60"
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm dịch vụ, thay nhớt, phủ ceramic, garage..."
            className="h-10 flex-1 bg-transparent px-3 text-xs text-ink placeholder:text-ink-muted focus:outline-none"
          />
          <button
            type="submit"
            className="bg-brand px-3.5 text-ink-inverse font-bold text-xs uppercase"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* TIER 3: Desktop Category Mega-Bar + Primary Multi-Page Navigation */}
      <div className="hidden lg:block border-t border-line bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            {/* All Categories Dropdown Trigger */}
            <div
              className="relative"
              onMouseEnter={() => setIsCatMenuOpen(true)}
              onMouseLeave={() => setIsCatMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsCatMenuOpen((prev) => !prev)}
                className="flex h-11 w-64 items-center justify-between bg-brand px-4 font-display text-sm font-extrabold uppercase tracking-wider text-ink-inverse cursor-pointer hover:bg-brand-hover transition-colors"
              >
                <span className="inline-flex items-center gap-2.5">
                  <LayoutGrid className="h-4 w-4" />
                  DANH MỤC DỊCH VỤ
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {isCatMenuOpen && (
                <div className="absolute left-0 top-full z-50 w-80 rounded-b-lg border border-line-strong bg-surface shadow-xl divide-y divide-line">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`${ROUTES.SERVICES}?danh-muc=${cat.id}`}
                      onClick={() => setIsCatMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-subtle group"
                    >
                      <div>
                        <span className="block text-sm font-semibold text-ink group-hover:text-brand">
                          {cat.shortLabel}
                        </span>
                        <span className="block text-[11px] text-ink-secondary">
                          {formatStartingVND(cat.startingPriceVnd)}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-ink-muted group-hover:text-brand" />
                    </Link>
                  ))}
                  <Link
                    href={ROUTES.SERVICES}
                    onClick={() => setIsCatMenuOpen(false)}
                    className="block rounded-b-lg bg-brand-soft px-4 py-2.5 text-center font-display text-xs font-bold uppercase tracking-wider text-brand hover:bg-brand hover:text-ink-inverse transition-colors"
                  >
                    XEM TOÀN BỘ 12 GÓI DỊCH VỤ →
                  </Link>
                </div>
              )}
            </div>

            {/* Primary Multi-Page Nav Links */}
            <nav className="flex items-center gap-1" aria-label="Menu chính">
              {SITE_CONFIG.navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative inline-flex h-11 items-center gap-1.5 px-3.5 text-sm font-semibold transition-colors",
                      isActive
                        ? "text-brand after:absolute after:inset-x-3.5 after:bottom-0 after:h-[2.5px] after:bg-brand"
                        : "text-ink-secondary hover:text-brand"
                    )}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="rounded-sm bg-accent-soft border border-accent/25 px-1.5 py-0.2 font-mono text-[10px] font-bold text-accent">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Instant Booking Link */}
          <Link
            href={ROUTES.CHECKOUT}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-ink-inverse shadow-xs transition-colors hover:bg-accent-hover"
          >
            <CalendarCheck2 className="h-4 w-4" />
            ĐẶT LỊCH NGAY
          </Link>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="border-t border-line bg-surface px-4 py-4 lg:hidden space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`${ROUTES.SERVICES}?danh-muc=${cat.id}`}
                onClick={() => setIsMobileOpen(false)}
                className="rounded-md border border-line bg-surface-subtle px-3 py-2 text-xs font-medium text-ink"
              >
                {cat.shortLabel}
              </Link>
            ))}
          </div>

          <nav className="flex flex-col divide-y divide-line border-y border-line">
            {SITE_CONFIG.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-between py-3 text-sm font-semibold text-ink"
              >
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4 text-ink-muted" />
              </Link>
            ))}
            <Link
              href={ROUTES.ACCOUNT}
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center justify-between py-3 text-sm font-semibold text-ink"
            >
              <span>Tài khoản & Sổ bảo dưỡng ({orders.length})</span>
              <ChevronRight className="h-4 w-4 text-ink-muted" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
