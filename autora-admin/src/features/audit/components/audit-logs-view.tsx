"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Search } from "lucide-react";
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
import { StatusPill } from "@/shared/ui/status-badge";
import { formatViDateTime } from "@/shared/utils/format";
import { fetchAdminAuditLogs } from "../api";

const EVENT_LABELS: Record<string, string> = {
  "admin.booking.status_updated": "Cập nhật trạng thái lịch hẹn",
  "admin.booking.created_hotline": "Tạo lịch hẹn Hotline / Walk-in",
  "admin.booking.rescheduled": "Dời lịch / Gán cầu nâng",
  "admin.booking.payment_captured": "Xác nhận thu tiền đơn",
  "admin.booking.payment_refunded": "Hoàn tiền đơn",
  "admin.booking.item_added": "Thêm hạng mục phát sinh",
  "admin.booking.item_removed": "Gỡ hạng mục dịch vụ",
  "admin.booking.inspection_recorded": "Lập biên bản kiểm tra xe DVI",
  "admin.garage.created": "Thêm garage mới",
  "admin.garage.updated": "Cập nhật hồ sơ garage",
  "admin.garage.status_updated": "Đổi trạng thái garage",
  "admin.garage.bay_created": "Thêm cầu nâng xưởng",
  "admin.garage.bay_updated": "Cập nhật cầu nâng xưởng",
  "admin.garage.bay_deleted": "Xóa cầu nâng xưởng",
  "admin.garage.services_synced": "Đồng bộ bảng giá dịch vụ garage",
  "admin.service.created": "Tạo gói dịch vụ mới",
  "admin.service.updated": "Cập nhật gói dịch vụ",
  "admin.service.activated": "Kích hoạt mở bán dịch vụ",
  "admin.service.deactivated": "Tạm ngưng gói dịch vụ",
  "admin.media.presigned": "Cấp chữ ký upload Cloudinary",
  "admin.media.uploaded": "Tải lên hình ảnh",
};

function formatPayloadPreview(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "—";
  try {
    const raw = JSON.stringify(payload);
    return raw.length > 140 ? `${raw.slice(0, 140)}…` : raw;
  } catch {
    return "—";
  }
}

export function AuditLogsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [resourceType, setResourceType] = useState("");

  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "audit-logs",
      { page, search: debouncedSearch, resourceType },
    ],
    queryFn: () =>
      fetchAdminAuditLogs({
        page,
        limit: 20,
        search: debouncedSearch,
        resourceType: resourceType || undefined,
      }),
  });

  const resetFilters = () => {
    setSearch("");
    setResourceType("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              placeholder="Tìm sự kiện, email người thao tác, ID đối tượng..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <Select
            aria-label="Lọc loại tài nguyên"
            value={resourceType}
            onChange={(e) => {
              setResourceType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả phân hệ</option>
            <option value="Booking">Lịch hẹn (Booking)</option>
            <option value="Garage">Garage</option>
            <option value="ServiceProduct">Dịch vụ (ServiceProduct)</option>
            <option value="Media">Hình ảnh (Media)</option>
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
        {isLoading && <TableSkeleton rows={8} cols={5} />}

        {isError && (
          <div className="p-5">
            <ErrorState
              message={
                error instanceof ApiError
                  ? error.message
                  : "Không thể tải nhật ký thao tác hệ thống."
              }
              status={error instanceof ApiError ? error.status : undefined}
              onRetry={() => void refetch()}
            />
          </div>
        )}

        {!isLoading && !isError && data && data.items.length === 0 && (
          <EmptyState
            title="Chưa ghi nhận nhật ký phù hợp"
            description="Thử thay đổi bộ lọc hoặc thực hiện các thao tác quản trị để ghi nhận nhật ký mới."
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
              <table className="w-full min-w-[840px] border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-subtle text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">
                    <th className="px-5 py-3">Thời gian</th>
                    <th className="px-4 py-3">Sự kiện</th>
                    <th className="px-4 py-3">Người thực hiện</th>
                    <th className="px-4 py-3">Đối tượng</th>
                    <th className="px-5 py-3">Dữ liệu thay đổi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((log) => (
                    <tr
                      key={log.id}
                      className="align-top transition-colors hover:bg-surface-subtle/60"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs tabular-nums text-ink-secondary">
                        {formatViDateTime(log.createdAt)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink">
                          {EVENT_LABELS[log.eventName] ?? log.eventName}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-ink-muted">
                          {log.eventName}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-ink">
                        {log.actorEmail ?? "Hệ thống"}
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusPill label={log.resourceType} tone="neutral" />
                        {log.resourceId && (
                          <div className="mt-1 font-mono text-[11px] text-ink-muted">
                            {log.resourceId.slice(0, 8)}…
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] text-ink-secondary break-all max-w-md">
                        {formatPayloadPreview(log.payloadJson)}
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

