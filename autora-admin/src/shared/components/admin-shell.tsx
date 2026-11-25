"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BellRing,
  Building2,
  CalendarClock,
  CalendarRange,
  FileClock,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  Newspaper,
  Package,
  ShieldCheck,
  ShieldPlus,
  Tag,
  Truck,
  UserCog,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/shared/utils/format";
import { Button } from "@/shared/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/bookings", label: "Lịch hẹn & RO", icon: CalendarClock, exact: true },
  { href: "/bookings/schedule", label: "Điều phối cầu nâng", icon: CalendarRange },
  { href: "/garages", label: "Quản lý Garage", icon: Building2 },
  { href: "/services", label: "Dịch vụ & Bảng giá", icon: Wrench },
  { href: "/inventory", label: "Kho phụ tùng", icon: Package, exact: true },
  { href: "/inventory/movements", label: "Thẻ kho (Ledger)", icon: History },
  { href: "/procurement", label: "Nhập hàng & NCC", icon: Truck },
  { href: "/equipment", label: "Thiết bị & Dụng cụ", icon: ShieldCheck },
  { href: "/staff", label: "Nhân sự & KTV", icon: UserCog },
  { href: "/warranties", label: "Bảo hành điện tử", icon: ShieldPlus },
  { href: "/promotions", label: "Khuyến mãi", icon: Tag },
  { href: "/reviews", label: "Kiểm duyệt đánh giá", icon: MessageSquareWarning },
  { href: "/reports", label: "Báo cáo P&L", icon: BarChart3 },
  { href: "/finance/cashbook", label: "Sổ quỹ Thu / Chi", icon: Wallet },
  { href: "/crm/reminders", label: "Nhắc bảo dưỡng CRM", icon: BellRing },
  { href: "/content/articles", label: "Bài viết Cẩm nang", icon: Newspaper },
  { href: "/content/leads", label: "Yêu cầu liên hệ", icon: Inbox },
  { href: "/customers", label: "Khách hàng", icon: Users },
  { href: "/audit-logs", label: "Nhật ký hệ thống", icon: FileClock },
] as const;

export function AdminShell({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeNav =
    NAV_ITEMS.find((item) =>
      "exact" in item && item.exact
        ? pathname === item.href
        : pathname.startsWith(item.href)
    ) ?? NAV_ITEMS[0];

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-line bg-surface">
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white font-bold text-sm">
            A
          </span>
          <div>
            <span className="block text-sm font-bold tracking-tight text-ink">
              AUTORA Admin
            </span>
            <span className="block text-[10px] font-medium text-ink-muted">
              Quản trị vận hành
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1 p-3" aria-label="Menu quản trị">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              "exact" in item && item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-soft font-semibold text-brand"
                    : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-3 space-y-2.5">
          <div className="rounded-lg bg-surface-subtle px-3 py-2">
            <strong className="block truncate text-xs font-semibold text-ink">
              {user?.fullName ?? "Quản trị viên"}
            </strong>
            <span className="block truncate text-[11px] text-ink-muted">
              {user?.email}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start"
            onClick={() => void logout()}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Đăng xuất</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex w-64 flex-col bg-surface shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <span className="text-sm font-bold text-ink">AUTORA Admin</span>
              <button
                type="button"
                aria-label="Đóng menu"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-1.5 text-ink-secondary hover:bg-surface-subtle cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto space-y-1 p-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  "exact" in item && item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-brand-soft font-semibold text-brand"
                        : "text-ink-secondary hover:bg-surface-subtle"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-line p-3">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => void logout()}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Đăng xuất</span>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between gap-4 border-b border-line bg-surface/95 px-4 sm:px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink lg:hidden cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-ink">
                {activeNav.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center rounded-md border border-blue-200 bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
              Quản trị viên
            </span>
            <span className="text-xs font-medium text-ink-secondary hidden md:inline">
              {user?.fullName}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

