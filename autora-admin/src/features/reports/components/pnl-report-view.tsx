"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { fetchAdminGarages } from "@/features/garages/api";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ErrorState, TableSkeleton } from "@/shared/ui/feedback";
import { Input, Select } from "@/shared/ui/input";
import { formatVnd } from "@/shared/utils/format";
import { fetchWorkshopPnl } from "../api";

export function PnlReportView() {
  const [garageId, setGarageId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: garagesData } = useQuery({
    queryKey: ["admin", "garages", "pnl"],
    queryFn: () => fetchAdminGarages({ page: 1, limit: 50 }),
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "reports", "pnl", { garageId, dateFrom, dateTo }],
    queryFn: () =>
      fetchWorkshopPnl({
        garageId: garageId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  });

  const exportCsv = () => {
    if (!data) return;
    const headers = [
      "Garage",
      "Số đơn PAID",
      "Doanh thu PAID (VNĐ)",
      "Giá vốn vật tư COGS (VNĐ)",
      "Hoa hồng KTV (VNĐ)",
      "Chi phí BH nội bộ (VNĐ)",
      "Lợi nhuận gộp (VNĐ)",
      "Phí sàn (VNĐ)",
      "Chi phí vận hành (VNĐ)",
      "Lợi nhuận ròng (VNĐ)",
      "Biên gộp (%)",
    ];
    const rows = data.byGarage.map((g) => [
      `"${g.garageName.replace(/"/g, '""')}"`,
      g.paidBookingCount,
      g.paidRevenueVnd,
      g.cogsVnd,
      g.technicianCommissionVnd,
      g.warrantyInternalCostVnd,
      g.grossProfitVnd,
      g.platformFeeVnd,
      g.operatingExpensesVnd,
      g.netProfitVnd,
      g.grossMarginPct,
    ]);
    const csv =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autora-pnl-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Báo cáo Lãi / Lỗ Thực tế (Workshop P&L)
          </h1>
          <p className="text-xs text-ink-secondary">
            Tổng hợp Doanh thu PAID − Giá vốn Phụ tùng (COGS) − Hoa hồng KTV − Bảo hành nội bộ − Chi phí Vận hành
          </p>
        </div>

        <Button variant="secondary" size="md" disabled={!data} onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Xuất CSV (UTF-8 BOM)
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Select value={garageId} onChange={(e) => setGarageId(e.target.value)}>
            <option value="">Tất cả Garage</option>
            {(garagesData?.items ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="Từ ngày"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="Đến ngày"
          />
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-5">
          <TableSkeleton rows={5} cols={6} />
        </Card>
      ) : isError || !data ? (
        <ErrorState
          message={
            error instanceof ApiError
              ? error.message
              : "Không thể tải báo cáo P&L."
          }
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Doanh thu đã thu (PAID)
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-ink">
                {formatVnd(data.summary.paidRevenueVnd)}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-secondary">
                COGS vật tư: {formatVnd(data.summary.cogsVnd)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Lợi nhuận Gộp Xưởng
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-brand">
                {formatVnd(data.summary.grossProfitVnd)}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-secondary">
                Biên gộp: {data.summary.grossMarginPct}%
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Chi phí Vận hành & Phí sàn
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-warning">
                {formatVnd(
                  data.summary.operatingExpensesVnd + data.summary.platformFeeVnd
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-secondary">
                Hoa hồng KTV: {formatVnd(data.summary.technicianCommissionVnd)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Lợi nhuận Ròng (Net Profit)
              </p>
              <p
                className={`mt-1 text-xl font-bold tabular-nums ${
                  data.summary.netProfitVnd >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {formatVnd(data.summary.netProfitVnd)}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-secondary">
                Dòng tiền ròng: {formatVnd(data.cashbook.netCashFlowVnd)}
              </p>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-line px-5 py-3.5">
              <h2 className="text-sm font-bold text-ink">
                Đối soát Đa chi nhánh Garage
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-surface-subtle text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                  <tr>
                    <th className="px-4 py-3">Garage</th>
                    <th className="px-4 py-3 text-right">Đơn PAID</th>
                    <th className="px-4 py-3 text-right">Doanh thu</th>
                    <th className="px-4 py-3 text-right">COGS Vật tư</th>
                    <th className="px-4 py-3 text-right">LN Gộp</th>
                    <th className="px-4 py-3 text-right">Chi Vận hành</th>
                    <th className="px-4 py-3 text-right">LN Ròng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.byGarage.map((g) => (
                    <tr key={g.garageId} className="hover:bg-surface-subtle/60">
                      <td className="px-4 py-3 font-semibold text-ink">
                        {g.garageName}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {g.paidBookingCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-ink">
                        {formatVnd(g.paidRevenueVnd)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-secondary">
                        {formatVnd(g.cogsVnd)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-brand">
                        {formatVnd(g.grossProfitVnd)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-secondary">
                        {formatVnd(g.operatingExpensesVnd)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold tabular-nums ${
                          g.netProfitVnd >= 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {formatVnd(g.netProfitVnd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

