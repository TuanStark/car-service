"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, MapPin, ShoppingBag, User } from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { useStore } from "@/features/cart/context/store-context";
import { cn } from "@/core/lib/cn";

export function MobileBottomDock() {
  const pathname = usePathname();
  const { cartCount, setMiniCartOpen } = useStore();

  const items = [
    { label: "Trang chủ", href: ROUTES.HOME, icon: Home, exact: true },
    { label: "Dịch vụ", href: ROUTES.SERVICES, icon: Wrench },
    { label: "Tìm gara", href: ROUTES.GARAGES, icon: MapPin },
  ];

  return (
    <nav
      aria-label="Điều hướng nhanh trên di động"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md pb-safe lg:hidden shadow-[0_-4px_20px_rgba(15,23,42,0.08)]"
    >
      <div className="grid grid-cols-5 items-center pt-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors",
                active ? "text-brand" : "text-ink-secondary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Cart Trigger */}
        <button
          type="button"
          onClick={() => setMiniCartOpen(true)}
          className="relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-ink-secondary hover:text-brand cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </div>
          <span>Giỏ hàng</span>
        </button>

        {/* Account */}
        <Link
          href={ROUTES.ACCOUNT}
          className={cn(
            "flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors",
            pathname.startsWith(ROUTES.ACCOUNT)
              ? "text-brand"
              : "text-ink-secondary"
          )}
        >
          <User className="h-5 w-5" />
          <span>Xe của tôi</span>
        </Link>
      </div>
    </nav>
  );
}

