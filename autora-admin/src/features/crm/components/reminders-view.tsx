"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Phone } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState, ErrorState, TableSkeleton } from "@/shared/ui/feedback";
import { StatusPill } from "@/shared/ui/status-badge";
import { formatViDate } from "@/shared/utils/format";
import { fetchMaintenanceReminders } from "../api";

export function RemindersView() {
  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "crm", "reminders"],
    queryFn: fetchMaintenanceReminders,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">
          Nhắc lịch Bảo dưỡng Định kỳ (CRM)
        </h1>
        <p className="text-xs text-ink-secondary">
          Tự động phát hiện xe ≥ 150 ngày chưa quay lại hoặc sắp chạm mốc ODO 5.000 / 10.000 / 20.000 / 40.000 km
        </p>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : "Không thể tải danh sách nhắc lịch bảo dưỡng."
            }
            onRetry={() => void refetch()}
          />
        ) : data.length === 0 ? (
          <EmptyState
            title="Chưa có xe nào đến hạn nhắc bảo dưỡng"
            description="Khi xe của khách hàng gần đến mốc ODO hoặc quá 150 ngày chưa bảo dưỡng, hệ thống sẽ liệt kê tại đây."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-surface-subtle text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                <tr>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Phương tiện & ODO</th>
                  <th className="px-4 py-3">Lần bảo dưỡng gần nhất</th>
                  <th className="px-4 py-3">Lý do nhắc lịch</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.map((r) => (
                  <tr key={r.vehicleId} className="hover:bg-surface-subtle/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{r.customerName}</div>
                      <div className="flex items-center gap-1 text-[11px] text-ink-secondary">
                        <Phone className="h-3 w-3 text-brand" />
                        {r.customerPhone ?? r.customerEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-brand">
                        {r.licensePlate}
                      </div>
                      <div className="text-ink">{r.vehicleLabel}</div>
                      <div className="text-[11px] text-ink-muted tabular-nums">
                        ODO: {new Intl.NumberFormat("vi-VN").format(r.currentOdoKm)} km
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">
                      {r.lastCompletedAt
                        ? formatViDate(r.lastCompletedAt)
                        : "Chưa có lịch sử"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill label={r.reason} tone="warning" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/bookings?search=${encodeURIComponent(r.licensePlate)}`}>
                        <Button size="sm" variant="secondary">
                          <CalendarPlus className="h-3.5 w-3.5" />
                          Đặt lịch / Xem RO
                        </Button>
                      </Link>
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

