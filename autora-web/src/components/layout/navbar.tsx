"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  MapPin,
  ChevronRight,
  Wrench,
} from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { useStore } from "@/features/cart/context/store-context";
import { cn } from "@/core/lib/cn";

const MAIN_NAV = [
  { label: "Sản phẩm & Dịch vụ", href: ROUTES.SERVICES },
  { label: "Bảng giá", href: ROUTES.PRICING },
  { label: "Hướng dẫn & Mẹo vặt", href: ROUTES.BLOG },
  { label: "Liên hệ", href: ROUTES.CONTACT },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, setMiniCartOpen, toastMessage } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isHomePage = pathname === "/";
  const isTransparent = isHomePage && !isScrolled && !isSearchOpen && !isMobileOpen;

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      query.trim()
        ? `${ROUTES.SERVICES}?q=${encodeURIComponent(query.trim())}`
        : ROUTES.SERVICES
    );
    setIsSearchOpen(false);
    setIsMobileOpen(false);
  };

  return (
    <header
      className={cn(
        "z-40 w-full pt-safe transition-all duration-300",
        isHomePage ? "fixed inset-x-0 top-0" : "sticky top-0",
        isTransparent
          ? "bg-transparent text-white border-b border-transparent"
          : "bg-white/95 backdrop-blur-md text-ink border-b border-line shadow-xs"
      )}
    >
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-brand/30 bg-surface px-4 py-3 text-xs sm:text-sm font-medium text-ink shadow-xl flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand + Single-Row Nav */}
        <div className="flex items-center gap-8">
          <Link href={ROUTES.HOME} className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white font-display text-xl font-extrabold shadow-sm">
              A
            </span>
            <span
              className={cn(
                "font-display text-2xl font-extrabold tracking-[0.06em] transition-colors",
                isTransparent ? "text-white drop-shadow-sm" : "text-ink"
              )}
            >
              AUTORA
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6" aria-label="Menu chính">
            {MAIN_NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    isTransparent
                      ? "text-white/95 hover:text-amber-300 drop-shadow-xs"
                      : active
                      ? "text-brand"
                      : "text-ink hover:text-brand"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Pill Buttons ("Tìm dịch vụ" + "Tìm gara") + Search + Account + Cart */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link
            href={ROUTES.SERVICES}
            data-agent-target="nav.services"
            className="hidden md:inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-hover transition-colors"
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Tìm dịch vụ</span>
          </Link>

          <Link
            href={ROUTES.GARAGES}
            data-agent-target="nav.garages"
            className={cn(
              "hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition-colors",
              isTransparent
                ? "border border-white/25 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
                : "border border-line-strong bg-white text-ink shadow-xs hover:bg-surface-subtle"
            )}
          >
            <MapPin className={cn("h-3.5 w-3.5", isTransparent ? "text-amber-300" : "text-brand")} />
            <span>Tìm gara</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsSearchOpen((v) => !v)}
            aria-label="Tìm kiếm"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md transition-colors cursor-pointer",
              isTransparent
                ? "text-white hover:bg-white/15"
                : "text-ink hover:bg-surface-subtle"
            )}
          >
            <Search className="h-4 w-4" />
          </button>

          <Link
            href={ROUTES.ACCOUNT}
            aria-label="Tài khoản"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
              isTransparent
                ? "text-white hover:bg-white/15"
                : "text-ink hover:bg-surface-subtle"
            )}
          >
            <User className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() => setMiniCartOpen(true)}
            data-agent-target="nav.cart"
            aria-label="Giỏ dịch vụ"
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-md transition-colors cursor-pointer",
              isTransparent
                ? "text-white hover:bg-white/15"
                : "text-ink hover:bg-surface-subtle"
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[10px] font-bold text-white">
              {cartCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileOpen((v) => !v)}
            aria-label="Mở menu"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md lg:hidden",
              isTransparent ? "text-white" : "text-ink"
            )}
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {isSearchOpen && (
        <div className="border-t border-line bg-surface-subtle px-4 py-3 text-ink">
          <form
            onSubmit={handleSearch}
            className="mx-auto flex max-w-3xl overflow-hidden rounded-lg border border-line-strong bg-surface"
          >
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập tên dịch vụ, lốp xe, dầu nhớt hoặc mã SKU (VD: ATR-BD-001)..."
              className="h-10 flex-1 px-4 text-sm text-ink focus:outline-none"
            />
            <button
              type="submit"
              className="bg-brand px-5 text-xs font-bold uppercase text-white hover:bg-brand-hover cursor-pointer"
            >
              Tìm kiếm
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="border-t border-line bg-surface px-4 py-4 text-ink lg:hidden space-y-2">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center justify-between border-b border-line py-3 text-sm font-semibold text-ink"
            >
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4 text-brand" />
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              href={ROUTES.SERVICES}
              onClick={() => setIsMobileOpen(false)}
              className="rounded-md bg-brand py-2.5 text-center text-xs font-bold text-white"
            >
              Tìm dịch vụ
            </Link>
            <Link
              href={ROUTES.GARAGES}
              onClick={() => setIsMobileOpen(false)}
              className="rounded-md border border-line-strong bg-surface py-2.5 text-center text-xs font-bold text-ink"
            >
              Tìm gara
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
