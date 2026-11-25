"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, Eye, Plus, RotateCcw, Search } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  EmptyState,
  ErrorState,
  Pagination,
  TableSkeleton,
} from "@/shared/ui/feedback";
import { Input, Select } from "@/shared/ui/input";
import { BookingStatusBadge, PaymentStatusBadge } from "@/shared/ui/status-badge";
import { formatViDate, formatVnd } from "@/shared/utils/format";
import { fetchAdminBookings } from "../api";
import { CreateBookingModal } from "./create-booking-modal";

export function BookingsListView() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "bookings",
      { page, search: debouncedSearch, status, dateFrom, dateTo },
    ],
    queryFn: () =>
      fetchAdminBookings({
        page,
        limit: 12,
        search: debouncedSearch,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  });

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                placeholder="Tìm mã đơn, khách hàng, SĐT, biển số..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            <Select
              aria-label="Lọc trạng thái lịch hẹn"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING_CONFIRMATION">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="CHECKED_IN">Đã tiếp nhận xe</option>
              <option value="IN_PROGRESS">Đang thực hiện</option>
              <option value="WAITING_APPROVAL">Chờ duyệt phát sinh</option>
              <option value="QC_PENDING">Đang kiểm tra QC</option>
              <option value="READY_FOR_PICKUP">Sẵn sàng giao xe</option>
              <option value="COMPLETED">Hoàn tất</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="NO_SHOW">Khách không đến</option>
            </Select>

            <Input
              type="date"
              aria-label="Từ ngày"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />

            <Input
              type="date"
              aria-label="Đến ngày"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {(search || status || dateFrom || dateTo) && (
              <Button variant="secondary" onClick={resetFilters}>
                <RotateCcw className="h-3.5 w-3.5" />
                Xóa lọc
              </Button>
            )}
            <Link
              href="/bookings/schedule"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 text-xs font-semibold text-ink hover:bg-surface-subtle"
            >
              <CalendarRange className="h-3.5 w-3.5 text-brand" />
              Lịch cầu nâng
            </Link>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Đặt lịch Hotline
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : isError ? (
          <div className="p-5">
            <ErrorState
              message={
                error instanceof ApiError
                  ? error.message
                  : "Không thể tải danh sách lịch hẹn."
              }
              status={error instanceof ApiError ? error.status : undefined}
              onRetry={() => void refetch()}
            />
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Không tìm thấy lịch hẹn phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm, trạng thái hoặc khoảng ngày hẹn."
            action={
              (search || status || dateFrom || dateTo) && (
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-line bg-surface-subtle/70 text-[11px] font-semibold uppercase text-ink-secondary">
                  <tr>
                    <th className="px-5 py-3">Mã đơn</th>
                    <th className="px-4 py-3">Khách hàng & Phương tiện</th>
                    <th className="px-4 py-3">Garage</th>
                    <th className="px-4 py-3">Ngày / Giờ hẹn</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thanh toán</th>
                    <th className="px-4 py-3 text-right">Tổng tiền</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-subtle/40 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-brand">
                        <Link
                          href={`/bookings/${item.id}`}
                          className="hover:underline"
                        >
                          {item.orderCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <strong className="block text-xs font-semibold text-ink">
                          {item.customerName} • {item.customerPhone}
                        </strong>
                        <span className="block text-[11px] text-ink-muted">
                          {item.vehicleLabel} ({item.licensePlate})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-secondary">
                        {item.garageName}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink tabular-nums">
                        {formatViDate(item.appointmentDate)} •{" "}
                        <span className="font-mono">{item.appointmentTime}</span>
                      </td>
                      <td className="px-4 py-3">
                        <BookingStatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PaymentStatusBadge status={item.paymentStatus} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                        {formatVnd(item.totalVnd)}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <Link
                          href={`/bookings/${item.id}`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-line-strong bg-surface px-2.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </Card>

      <CreateBookingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

