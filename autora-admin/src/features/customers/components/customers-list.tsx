"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye, RotateCcw, Search } from "lucide-react";
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
import { UserStatusBadge } from "@/shared/ui/status-badge";
import { formatViDate, formatViDateTime } from "@/shared/utils/format";
import { fetchAdminCustomers } from "../api";

export function CustomersListView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "customers",
      { page, search: debouncedSearch, status },
    ],
    queryFn: () =>
      fetchAdminCustomers({
        page,
        limit: 12,
        search: debouncedSearch,
        status: status || undefined,
      }),
  });

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              placeholder="Tìm tên khách hàng, email hoặc số điện thoại..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <Select
            aria-label="Lọc trạng thái tài khoản"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Mọi trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Chưa kích hoạt</option>
            <option value="SUSPENDED">Đã khóa</option>
          </Select>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={resetFilters}>
              <RotateCcw className="h-3.5 w-3.5" />
              Đặt lại bộ lọc
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        {isLoading && <TableSkeleton rows={6} cols={6} />}

        {isError && (
          <div className="p-5">
            <ErrorState
              message={
                error instanceof ApiError
                  ? error.message
                  : "Không thể tải danh sách khách hàng."
              }
              status={error instanceof ApiError ? error.status : undefined}
              onRetry={() => void refetch()}
            />
          </div>
        )}

        {!isLoading && !isError && data && data.items.length === 0 && (
          <EmptyState
            title="Chưa có khách hàng phù hợp"
            description="Thử thay đổi từ khóa tìm kiếm hoặc trạng thái tài khoản."
            action={
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Xóa bộ lọc
              </Button>
            }
          />
        )}

        {!isLoading && !isError && data && data.items.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-subtle text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">
                    <th className="px-5 py-3">Khách hàng</th>
                    <th className="px-4 py-3">Số điện thoại</th>
                    <th className="px-4 py-3 text-center">Xe đã lưu</th>
                    <th className="px-4 py-3 text-center">Lịch hẹn</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Đăng nhập gần nhất</th>
                    <th className="px-5 py-3 text-right">Hồ sơ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-surface-subtle/60"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/customers/${item.id}`}
                          className="font-semibold text-ink hover:text-brand"
                        >
                          {item.fullName}
                        </Link>
                        <div className="text-[11px] text-ink-secondary">
                          {item.email}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 tabular-nums text-xs text-ink">
                        {item.phone ?? "Chưa cập nhật"}
                      </td>

                      <td className="px-4 py-3.5 text-center tabular-nums font-medium text-ink">
                        {item.vehicleCount}
                      </td>

                      <td className="px-4 py-3.5 text-center tabular-nums font-medium text-ink">
                        {item.bookingCount}
                      </td>

                      <td className="px-4 py-3.5">
                        <UserStatusBadge status={item.status} />
                      </td>

                      <td className="px-4 py-3.5 text-xs text-ink-secondary">
                        {item.lastLoginAt
                          ? formatViDateTime(item.lastLoginAt)
                          : `Đăng ký ${formatViDate(item.createdAt)}`}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/customers/${item.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-subtle"
                        >
                          <Eye className="h-3.5 w-3.5 text-ink-secondary" />
                          Xem hồ sơ
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
    </div>
  );
}

