"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Eye, MapPin, RotateCcw, Search } from "lucide-react";
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
import { GarageStatusBadge, StatusPill } from "@/shared/ui/status-badge";
import { formatVnd } from "@/shared/utils/format";
import { fetchAdminGarages } from "../api";

export function GaragesListView() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [status, setStatus] = useState("");
  const [verified, setVerified] = useState(searchParams.get("verified") ?? "");

  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "garages",
      { page, search: debouncedSearch, cityCode, status, verified },
    ],
    queryFn: () =>
      fetchAdminGarages({
        page,
        limit: 12,
        search: debouncedSearch,
        cityCode: cityCode || undefined,
        status: status || undefined,
        verified: verified || undefined,
      }),
  });

  const resetFilters = () => {
    setSearch("");
    setCityCode("");
    setStatus("");
    setVerified("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              placeholder="Tìm tên garage, quận/huyện, địa chỉ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <Select
            aria-label="Lọc khu vực"
            value={cityCode}
            onChange={(e) => {
              setCityCode(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả khu vực</option>
            <option value="HCM">TP. Hồ Chí Minh</option>
            <option value="HN">Hà Nội</option>
            <option value="DN">Đà Nẵng</option>
          </Select>

          <Select
            aria-label="Lọc trạng thái hoạt động"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Mọi trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm ngưng</option>
            <option value="SUSPENDED">Đình chỉ</option>
          </Select>

          <div className="flex items-center gap-2">
            <Select
              aria-label="Lọc xác minh"
              value={verified}
              onChange={(e) => {
                setVerified(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả xác minh</option>
              <option value="true">Đã xác minh</option>
              <option value="false">Chưa xác minh</option>
            </Select>
            {(search || cityCode || status || verified) && (
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : isError ? (
          <div className="p-5">
            <ErrorState
              message={
                error instanceof ApiError
                  ? error.message
                  : "Không thể tải danh sách garage."
              }
              status={error instanceof ApiError ? error.status : undefined}
              onRetry={() => void refetch()}
            />
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Không tìm thấy garage phù hợp"
            description="Thử thay đổi bộ lọc khu vực hoặc trạng thái xác minh."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-line bg-surface-subtle/70 text-[11px] font-semibold uppercase text-ink-secondary">
                  <tr>
                    <th className="px-5 py-3">Garage</th>
                    <th className="px-4 py-3">Khu vực</th>
                    <th className="px-4 py-3">Cầu nâng / Giá từ</th>
                    <th className="px-4 py-3">Xác minh</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Dịch vụ / Đơn</th>
                    <th className="px-5 py-3 text-right">Quản lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((g) => (
                    <tr
                      key={g.id}
                      className="hover:bg-surface-subtle/40 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/garages/${g.id}`}
                          className="font-semibold text-ink hover:text-brand"
                        >
                          {g.name}
                        </Link>
                        <span className="block text-[11px] text-ink-muted">
                          {g.fullAddress}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-secondary">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-brand" />
                          {g.district}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums">
                        <span className="block font-semibold text-ink">
                          {g.bayCount} cầu nâng
                        </span>
                        <span className="text-[11px] text-ink-secondary">
                          Từ {formatVnd(g.startingPriceVnd)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {g.verified ? (
                          <StatusPill label="Đã xác minh" tone="brand" />
                        ) : (
                          <StatusPill label="Chờ duyệt" tone="warning" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <GarageStatusBadge status={g.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-ink-secondary tabular-nums">
                        {g.serviceCount} dịch vụ • {g.bookingCount} đơn
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/garages/${g.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-line-strong bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
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
    </div>
  );
}
