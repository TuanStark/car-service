"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { Card, CardHeader } from "@/shared/ui/card";
import { EmptyState, ErrorState, TableSkeleton } from "@/shared/ui/feedback";
import { BookingStatusBadge, PaymentStatusBadge } from "@/shared/ui/status-badge";
import { formatViDate, formatVnd } from "@/shared/utils/format";
import { fetchDashboardOverview } from "../api";

export function DashboardOverviewView() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "dashboard", "overview"],
    queryFn: fetchDashboardOverview,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-line bg-surface p-5"
            />
          ))}
        </div>
        <Card>
          <TableSkeleton rows={6} cols={6} />
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        message={
          error instanceof ApiError
            ? error.message
            : "Không thể tải dữ liệu tổng quan vận hành."
        }
        status={error instanceof ApiError ? error.status : undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  const kpiCards = [
    {
      label: "Tổng lịch hẹn",
      value: data.kpis.totalBookings,
      sub: `${data.kpis.confirmedBookings} đã xác nhận • ${data.kpis.inProgressBookings} đang làm`,
      icon: CalendarClock,
      tone: "text-brand bg-brand-soft",
    },
    {
      label: "Chờ xác nhận",
      value: data.kpis.pendingBookings,
      sub: "Cần duyệt lịch & sắp cầu nâng",
      icon: Clock,
      tone: "text-amber-700 bg-amber-50",
    },
    {
      label: "Hoàn tất",
      value: data.kpis.completedBookings,
      sub: "Đã nghiệm thu bàn giao xe",
      icon: CheckCircle2,
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Đã hủy",
      value: data.kpis.cancelledBookings,
      sub: "Đơn đã hủy có ghi nhận lý do",
      icon: XCircle,
      tone: "text-rose-700 bg-rose-50",
    },
    {
      label: "Garage hoạt động",
      value: data.kpis.activeGarages,
      sub: `${data.kpis.unverifiedGarages} garage chờ xác minh`,
      icon: Building2,
      tone: "text-sky-700 bg-sky-50",
    },
    {
      label: "Khách hàng đăng ký",
      value: data.kpis.registeredCustomers,
      sub: "Tài khoản chủ xe trên hệ thống",
      icon: Users,
      tone: "text-indigo-700 bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-line bg-surface p-5 shadow-xs flex items-start justify-between gap-4"
            >
              <div>
                <span className="text-xs font-semibold text-ink-secondary">
                  {item.label}
                </span>
                <strong className="mt-1.5 block text-2xl font-bold text-ink tabular-nums">
                  {item.value}
                </strong>
                <span className="mt-1 block text-[11px] text-ink-muted">
                  {item.sub}
                </span>
              </div>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}
              >
                <Icon className="h-5 w-5" />
              </span>
            </div>
          );
        })}
      </div>

      {/* Revenue + Operational Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader
            title="Doanh thu ghi nhận thực tế"
            description="Tổng hợp từ dữ liệu thanh toán của đơn đặt lịch"
            action={<Wallet className="h-4 w-4 text-brand" />}
          />
          <div className="space-y-4 p-5">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
              <span className="text-xs font-medium text-emerald-800">
                Đã thanh toán ({data.revenue.paidBookingCount} đơn)
              </span>
              <strong className="mt-1 block text-2xl font-bold text-emerald-900 tabular-nums">
                {formatVnd(data.revenue.collectedRevenueVnd)}
              </strong>
            </div>

            <div className="rounded-lg border border-line bg-surface-subtle/60 p-4">
              <span className="text-xs font-medium text-ink-secondary">
                Đơn hoàn tất chờ đối soát thu tiền tại xưởng
              </span>
              <strong className="mt-1 block text-lg font-bold text-ink tabular-nums">
                {formatVnd(data.revenue.pendingCollectionVnd)}
              </strong>
            </div>

            <p className="text-[11px] leading-relaxed text-ink-muted">
              {data.revenue.sourceNote}
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader
            title="Cảnh báo vận hành cần xử lý"
            description="Các đầu việc phát sinh trực tiếp từ trạng thái hệ thống"
          />
          <div className="divide-y divide-line">
            {data.alerts.length === 0 ? (
              <EmptyState
                title="Hệ thống vận hành ổn định"
                description="Hiện không có cảnh báo tồn đọng nào cần xử lý gấp."
              />
            ) : (
              data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        alert.severity === "warning"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div>
                      <strong className="block text-xs sm:text-sm font-semibold text-ink">
                        {alert.title}
                      </strong>
                      <p className="mt-0.5 text-xs text-ink-secondary">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={alert.href}
                    className="inline-flex items-center gap-1 rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-soft transition-colors"
                  >
                    Xử lý
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader
          title="Hoạt động đặt lịch gần đây"
          description="8 lịch hẹn mới nhất được ghi nhận trên nền tảng"
          action={
            <Link
              href="/bookings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
            >
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        {data.recentBookings.length === 0 ? (
          <EmptyState
            title="Chưa có lịch hẹn nào"
            description="Các lịch hẹn mới đặt từ website sẽ hiển thị tại đây."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-line bg-surface-subtle/70 text-[11px] font-semibold uppercase text-ink-secondary">
                <tr>
                  <th className="px-5 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Khách hàng / Xe</th>
                  <th className="px-4 py-3">Garage tiếp nhận</th>
                  <th className="px-4 py-3">Thời gian hẹn</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Thanh toán</th>
                  <th className="px-5 py-3 text-right">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-surface-subtle/40 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-brand">
                      <Link href={`/bookings/${b.id}`} className="hover:underline">
                        {b.orderCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <strong className="block text-xs font-semibold text-ink">
                        {b.customerName}
                      </strong>
                      <span className="block text-[11px] text-ink-muted">
                        {b.vehicleLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-secondary">
                      {b.garageName}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink tabular-nums">
                      {formatViDate(b.appointmentDate)} • {b.appointmentTime}
                    </td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={b.paymentStatus} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-ink tabular-nums">
                      {formatVnd(b.totalVnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

