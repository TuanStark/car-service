"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { fetchAdminGarages } from "@/features/garages/api";
import { Card } from "@/shared/ui/card";
import {
  EmptyState,
  ErrorState,
  Pagination,
  TableSkeleton,
} from "@/shared/ui/feedback";
import { Select } from "@/shared/ui/input";
import { StatusPill } from "@/shared/ui/status-badge";
import { formatViDateTime, formatVnd } from "@/shared/utils/format";
import { fetchStockMovements, type StockMovementType } from "../api";

const MOVEMENT_META: Record<
  StockMovementType,
  { label: string; tone: "success" | "danger" | "warning" | "info" | "neutral" }
> = {
  IN_PO: { label: "Nhập kho PO", tone: "success" },
  OUT_WORK_ORDER: { label: "Xuất lệnh sửa chữa", tone: "warning" },
  RETURN_WORK_ORDER: { label: "Hoàn kho từ RO", tone: "info" },
  ADJUST_IN: { label: "Kiểm kê tăng", tone: "success" },
  ADJUST_OUT: { label: "Kiểm kê giảm", tone: "danger" },
  TRANSFER_IN: { label: "Nhận điều chuyển", tone: "info" },
  TRANSFER_OUT: { label: "Xuất điều chuyển", tone: "neutral" },
};

export function StockMovementsView() {
  const [page, setPage] = useState(1);
  const [garageId, setGarageId] = useState("");
  const [type, setType] = useState<StockMovementType | "">("");

  const { data: garagesData } = useQuery({
    queryKey: ["admin", "garages", "movements-filter"],
    queryFn: () => fetchAdminGarages({ page: 1, limit: 50 }),
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "inventory", "movements", { page, garageId, type }],
    queryFn: () =>
      fetchStockMovements({
        page,
        limit: 25,
        garageId: garageId || undefined,
        type: type || undefined,
      }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/inventory"
            className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-brand"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại Tồn kho
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Thẻ kho & Lịch sử Xuất/Nhập (Stock Ledger)
          </h1>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Select
            value={garageId}
            onChange={(e) => {
              setGarageId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả Garage</option>
            {(garagesData?.items ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>

          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value as StockMovementType | "");
              setPage(1);
            }}
          >
            <option value="">Tất cả loại giao dịch</option>
            {Object.entries(MOVEMENT_META).map(([k, m]) => (
              <option key={k} value={k}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : "Không thể tải lịch sử thẻ kho."
            }
            onRetry={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có biến động kho nào"
            description="Mọi thao tác nhập PO, xuất BOM cho RO, kiểm kê hoặc chuyển kho sẽ được ghi nhận tại đây."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-surface-subtle text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                  <tr>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Garage</th>
                    <th className="px-4 py-3">Phụ tùng</th>
                    <th className="px-4 py-3">Loại giao dịch</th>
                    <th className="px-4 py-3 text-right">Biến động</th>
                    <th className="px-4 py-3 text-right">Đơn giá vốn</th>
                    <th className="px-4 py-3">Lý do / Người thực hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((m) => {
                    const meta = MOVEMENT_META[m.type];
                    const isPositive = m.qtyDelta > 0;
                    return (
                      <tr key={m.id} className="hover:bg-surface-subtle/60">
                        <td className="px-4 py-3 font-mono text-[11px] text-ink-secondary">
                          {formatViDateTime(m.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink">
                          {m.garageName}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[11px] font-semibold text-brand">
                            {m.sku}
                          </span>
                          <div className="text-ink">{m.partName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill label={meta.label} tone={meta.tone} />
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-bold tabular-nums ${
                            isPositive ? "text-success" : "text-danger"
                          }`}
                        >
                          {isPositive ? `+${m.qtyDelta}` : m.qtyDelta} {m.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-secondary">
                          {formatVnd(m.unitCostVnd)}
                        </td>
                        <td className="px-4 py-3 text-ink-secondary">
                          <div>{m.reason ?? "—"}</div>
                          {m.createdByEmail && (
                            <div className="text-[11px] text-ink-muted">
                              {m.createdByEmail}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {data?.meta && (
              <div className="border-t border-line px-4 py-3">
                <Pagination meta={data.meta} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
