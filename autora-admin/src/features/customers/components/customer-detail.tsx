"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Car, Mail, Phone, ShieldCheck } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { Card, CardHeader } from "@/shared/ui/card";
import { EmptyState, ErrorState, TableSkeleton } from "@/shared/ui/feedback";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
  StatusPill,
  UserStatusBadge,
} from "@/shared/ui/status-badge";
import { formatViDate, formatViDateTime, formatVnd } from "@/shared/utils/format";
import { fetchAdminCustomerProfile } from "../api";

export function CustomerDetailView({
  customerId,
}: {
  readonly customerId: string;
}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "customer", customerId],
    queryFn: () => fetchAdminCustomerProfile(customerId),
  });

  if (isLoading) {
    return (
      <Card>
        <TableSkeleton rows={6} cols={4} />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        message={
          error instanceof ApiError
            ? error.message
            : "Không tìm thấy hồ sơ khách hàng."
        }
        status={error instanceof ApiError ? error.status : undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-subtle"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Danh sách khách hàng
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-ink">{data.fullName}</h2>
              <UserStatusBadge status={data.status} />
            </div>
            <p className="text-xs text-ink-secondary">
              Tham gia ngày {formatViDate(data.createdAt)} •{" "}
              {data.lastLoginAt
                ? `Đăng nhập gần nhất ${formatViDateTime(data.lastLoginAt)}`
                : "Chưa có phiên đăng nhập gần đây"}
            </p>
          </div>
        </div>
      </div>

      {/* PII-minimized Account Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-secondary">
            <Mail className="h-4 w-4 text-brand" />
            Email liên hệ
          </div>
          <div className="mt-2 truncate text-sm font-semibold text-ink">
            {data.email}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-secondary">
            <Phone className="h-4 w-4 text-brand" />
            Số điện thoại
          </div>
          <div className="mt-2 text-sm font-semibold tabular-nums text-ink">
            {data.phone ?? "Chưa cập nhật"}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-secondary">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Quy mô hồ sơ
          </div>
          <div className="mt-2 text-sm font-semibold text-ink">
            {data.vehicleCount} xe đã lưu • {data.bookingCount} lịch hẹn
          </div>
        </Card>
      </div>

      {/* Registered Vehicles */}
      <Card>
        <CardHeader
          title="Xe thuộc sở hữu khách hàng"
          description="Thông số phương tiện phục vụ tra cứu lịch sử bảo dưỡng."
        />
        {data.vehicles.length === 0 ? (
          <EmptyState
            title="Chưa có thông tin xe"
            description="Khách hàng này chưa lưu phương tiện nào trên hệ thống."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-subtle text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">
                  <th className="px-5 py-3">Dòng xe</th>
                  <th className="px-4 py-3">Phân khúc</th>
                  <th className="px-4 py-3">Biển số</th>
                  <th className="px-4 py-3 text-right">Số ODO hiện tại</th>
                  <th className="px-5 py-3">Mặc định</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.vehicles.map((v) => (
                  <tr key={v.id}>
                    <td className="px-5 py-3 font-medium text-ink">
                      <span className="inline-flex items-center gap-2">
                        <Car className="h-4 w-4 text-ink-muted" />
                        {v.brand} {v.model} ({v.year})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-secondary">
                      {v.bodyType}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-ink">
                      {v.licensePlate}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-ink">
                      {new Intl.NumberFormat("vi-VN").format(v.currentOdoKm)} km
                    </td>
                    <td className="px-5 py-3">
                      {v.isPrimary ? (
                        <StatusPill label="Xe chính" tone="brand" />
                      ) : (
                        <span className="text-xs text-ink-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Booking History */}
      <Card>
        <CardHeader
          title="Lịch sử đặt lịch gần đây"
          description="Hiển thị tối đa 25 lịch hẹn gần nhất của khách hàng."
        />
        {data.bookings.length === 0 ? (
          <EmptyState
            title="Chưa có lịch hẹn nào"
            description="Khách hàng chưa phát sinh đơn đặt lịch dịch vụ."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-subtle text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">
                  <th className="px-5 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Ngày / Giờ hẹn</th>
                  <th className="px-4 py-3">Garage & Xe</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Thanh toán</th>
                  <th className="px-5 py-3 text-right">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="transition-colors hover:bg-surface-subtle/60"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="font-mono text-xs font-bold text-brand hover:underline"
                      >
                        {b.orderCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-ink">
                      {formatViDate(b.appointmentDate)} • {b.appointmentTime}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-ink">{b.garageName}</div>
                      <div className="text-[11px] text-ink-secondary">
                        {b.vehicleLabel}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={b.paymentStatus} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-ink">
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

