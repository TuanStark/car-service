"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeftRight,
  History,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { fetchAdminGarages } from "@/features/garages/api";
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
import { useToast } from "@/shared/ui/toast-provider";
import { formatVnd } from "@/shared/utils/format";
import {
  adjustGarageInventory,
  createAdminPart,
  fetchGarageInventory,
  type GarageInventoryRow,
  type PartCategory,
  transferGarageInventory,
} from "../api";

const CATEGORY_LABELS: Record<PartCategory, string> = {
  OIL_FLUID: "Dầu nhớt & Dung dịch",
  FILTER: "Lọc gió / Lọc dầu",
  BRAKE_SUSPENSION: "Phanh & Hệ thống treo",
  TIRE_BATTERY: "Lốp & Ắc quy",
  DETAILING_CHEM: "Hóa chất Detailing",
  CONSUMABLE: "Vật tư tiêu hao",
  OTHER: "Khác",
};

export function InventoryListView() {
  const [page, setPage] = useState(1);
  const [garageId, setGarageId] = useState("");
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [createPartOpen, setCreatePartOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<GarageInventoryRow | null>(null);
  const [transferTarget, setTransferTarget] = useState<GarageInventoryRow | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: garagesData } = useQuery({
    queryKey: ["admin", "garages", "inventory-filter"],
    queryFn: () => fetchAdminGarages({ page: 1, limit: 50 }),
  });
  const garages = garagesData?.items ?? [];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "inventory",
      { page, garageId, search: debouncedSearch, lowStockOnly },
    ],
    queryFn: () =>
      fetchGarageInventory({
        page,
        limit: 20,
        garageId: garageId || undefined,
        search: debouncedSearch || undefined,
        lowStockOnly,
      }),
  });

  const items = data?.items ?? [];
  const totalValueVnd = items.reduce((s, r) => s + r.inventoryValueVnd, 0);
  const lowStockCount = items.filter((r) => r.isLowStock).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Kho Phụ tùng & Vật tư tiêu hao
          </h1>
          <p className="text-xs text-ink-secondary">
            Theo dõi tồn kho thực tế theo từng Garage, định mức tối thiểu và giá vốn bình quân gia quyền
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/inventory/movements">
            <Button variant="secondary" size="md">
              <History className="h-4 w-4" />
              Thẻ kho (Ledger)
            </Button>
          </Link>
          <Button size="md" onClick={() => setCreatePartOpen(true)}>
            <Plus className="h-4 w-4" />
            Thêm mã phụ tùng
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Số dòng tồn kho (trang này)
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
            {data?.meta.totalItems ?? 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Cảnh báo sắp hết hàng
          </p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-bold tabular-nums text-danger">
            {lowStockCount}
            {lowStockCount > 0 && <AlertTriangle className="h-5 w-5" />}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Giá trị tồn kho (trang này)
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand">
            {formatVnd(totalValueVnd)}
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              className="pl-9"
              placeholder="Tìm theo mã SKU, tên phụ tùng, thương hiệu..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="md:col-span-4">
            <Select
              value={garageId}
              onChange={(e) => {
                setGarageId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả Garage</option>
              {garages.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center md:col-span-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => {
                  setLowStockOnly(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-line-strong text-brand"
              />
              Chỉ hiện sắp hết hàng (≤ Min)
            </label>
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : "Không thể tải danh sách tồn kho."
            }
            onRetry={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có dữ liệu tồn kho phù hợp"
            description="Hãy thêm mã phụ tùng mới hoặc điều chỉnh bộ lọc tìm kiếm."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-surface-subtle text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                  <tr>
                    <th className="px-4 py-3">SKU / Phụ tùng</th>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3">Garage</th>
                    <th className="px-4 py-3 text-right">Tồn kho</th>
                    <th className="px-4 py-3 text-right">Giá vốn BQ</th>
                    <th className="px-4 py-3 text-right">Giá bán lẻ</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((row) => (
                    <tr key={row.id} className="hover:bg-surface-subtle/60">
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] font-semibold text-brand">
                          {row.sku}
                        </div>
                        <div className="font-semibold text-ink">{row.partName}</div>
                        {row.brand && (
                          <div className="text-[11px] text-ink-muted">
                            Hãng: {row.brand}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">
                        {CATEGORY_LABELS[row.category]}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{row.garageName}</div>
                        {row.binLocation && (
                          <div className="text-[11px] text-ink-muted">
                            Kệ: {row.binLocation}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-sm font-bold text-ink">
                            {row.onHandQty} {row.unit}
                          </span>
                          {row.isLowStock && (
                            <StatusPill label="Sắp hết" tone="danger" />
                          )}
                        </div>
                        <div className="text-[11px] text-ink-muted">
                          Min: {row.minStockThreshold} {row.unit}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-ink">
                        {formatVnd(row.avgCostVnd)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-secondary">
                        {formatVnd(row.sellPriceVnd)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setAdjustTarget(row)}
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Điều chỉnh
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTransferTarget(row)}
                          >
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                            Chuyển kho
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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

      {createPartOpen && (
        <CreatePartModal
          garages={garages}
          onClose={() => setCreatePartOpen(false)}
        />
      )}

      {adjustTarget && (
        <AdjustStockModal
          row={adjustTarget}
          onClose={() => setAdjustTarget(null)}
        />
      )}

      {transferTarget && (
        <TransferStockModal
          row={transferTarget}
          garages={garages}
          onClose={() => setTransferTarget(null)}
        />
      )}
    </div>
  );
}

function CreatePartModal({
  garages,
  onClose,
}: {
  readonly garages: readonly { id: string; name: string }[];
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PartCategory>("OIL_FLUID");
  const [unit, setUnit] = useState("Lít");
  const [brand, setBrand] = useState("");
  const [avgCostVnd, setAvgCostVnd] = useState("150000");
  const [sellPriceVnd, setSellPriceVnd] = useState("220000");
  const [minStockThreshold, setMinStockThreshold] = useState("5");
  const [initialGarageId, setInitialGarageId] = useState(garages[0]?.id ?? "");
  const [initialQty, setInitialQty] = useState("0");

  const mutation = useMutation({
    mutationFn: async () => {
      const part = await createAdminPart({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category,
        unit: unit.trim(),
        brand: brand.trim() || undefined,
        avgCostVnd: Number(avgCostVnd),
        sellPriceVnd: Number(sellPriceVnd),
        minStockThreshold: Number(minStockThreshold),
      });
      const initQ = Number(initialQty);
      if (initialGarageId && initQ > 0) {
        await adjustGarageInventory({
          garageId: initialGarageId,
          partItemId: part.id,
          qtyDelta: initQ,
          reason: "Khởi tạo tồn kho đầu kỳ khi tạo mã phụ tùng",
        });
      }
      return part;
    },
    onSuccess: (part) => {
      notifySuccess(`Đã tạo mã phụ tùng ${part.sku} — ${part.name}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "parts"] });
      onClose();
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError
          ? err.message
          : "Không thể tạo phụ tùng. Vui lòng kiểm tra lại dữ liệu."
      );
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">Thêm mã Phụ tùng / Vật tư mới</h3>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Mã SKU *</label>
              <Input
                required
                placeholder="VD: PT-OIL-0W20"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Đơn vị tính *</label>
              <Input
                required
                placeholder="VD: Lít, Cái, Bộ, Chai"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Tên phụ tùng / vật tư *</label>
            <Input
              required
              placeholder="VD: Dầu nhớt tổng hợp Mobil 1 0W-20"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Danh mục *</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as PartCategory)}
              >
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Thương hiệu</label>
              <Input
                placeholder="VD: Castrol, Bosch, Mobil"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Giá vốn (VNĐ)</label>
              <Input
                type="number"
                min={0}
                required
                value={avgCostVnd}
                onChange={(e) => setAvgCostVnd(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Giá bán lẻ (VNĐ)</label>
              <Input
                type="number"
                min={0}
                required
                value={sellPriceVnd}
                onChange={(e) => setSellPriceVnd(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Định mức Min</label>
              <Input
                type="number"
                min={0}
                required
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-subtle p-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                Nhập tồn đầu kỳ vào Garage
              </label>
              <Select
                value={initialGarageId}
                onChange={(e) => setInitialGarageId(e.target.value)}
              >
                {garages.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                Số lượng đầu kỳ
              </label>
              <Input
                type="number"
                min={0}
                step="0.5"
                value={initialQty}
                onChange={(e) => setInitialQty(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang tạo..." : "Lưu mã phụ tùng"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdjustStockModal({
  row,
  onClose,
}: {
  readonly row: GarageInventoryRow;
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [qtyDelta, setQtyDelta] = useState("5");
  const [reason, setReason] = useState("Kiểm kê định kỳ");
  const [binLocation, setBinLocation] = useState(row.binLocation ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      adjustGarageInventory({
        garageId: row.garageId,
        partItemId: row.partItemId,
        qtyDelta: Number(qtyDelta),
        reason: reason.trim(),
        binLocation: binLocation.trim() || undefined,
      }),
    onSuccess: () => {
      notifySuccess(`Đã điều chỉnh tồn kho ${row.sku} tại ${row.garageName}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      onClose();
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError
          ? err.message
          : "Điều chỉnh thất bại. Vui lòng kiểm tra lại số lượng."
      );
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">Điều chỉnh tồn kho</h3>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-4 space-y-3"
        >
          <div className="rounded-lg border border-line bg-surface-subtle p-3 text-xs">
            <strong className="block text-ink">
              {row.sku} — {row.partName}
            </strong>
            <span className="text-ink-secondary">
              {row.garageName} · Tồn hiện tại:{" "}
              <strong className="text-ink">
                {row.onHandQty} {row.unit}
              </strong>
            </span>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              Số lượng thay đổi (+ nhập thêm / - xuất hao hụt) *
            </label>
            <Input
              type="number"
              step="0.5"
              required
              value={qtyDelta}
              onChange={(e) => setQtyDelta(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Vị trí kệ (Bin)</label>
            <Input
              placeholder="VD: Kệ A2-04"
              value={binLocation}
              onChange={(e) => setBinLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Lý do điều chỉnh *</label>
            <Input
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang lưu..." : "Xác nhận điều chỉnh"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransferStockModal({
  row,
  garages,
  onClose,
}: {
  readonly row: GarageInventoryRow;
  readonly garages: readonly { id: string; name: string }[];
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const otherGarages = garages.filter((g) => g.id !== row.garageId);
  const [toGarageId, setToGarageId] = useState(otherGarages[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("Điều chuyển nội bộ bổ sung tồn kho");

  const mutation = useMutation({
    mutationFn: () =>
      transferGarageInventory({
        fromGarageId: row.garageId,
        toGarageId,
        partItemId: row.partItemId,
        qty: Number(qty),
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      notifySuccess(`Điều chuyển kho thành công ${qty} ${row.unit} ${row.sku}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      onClose();
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError ? err.message : "Điều chuyển thất bại. Vui lòng kiểm tra lại."
      );
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">Điều chuyển kho giữa các Garage</h3>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-4 space-y-3"
        >
          <div className="rounded-lg border border-line bg-surface-subtle p-3 text-xs">
            <strong className="block text-ink">
              {row.sku} — {row.partName}
            </strong>
            <span className="text-ink-secondary">
              Từ: <strong>{row.garageName}</strong> (Khả dụng: {row.availableQty} {row.unit})
            </span>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Chuyển đến Garage *</label>
            <Select
              required
              value={toGarageId}
              onChange={(e) => setToGarageId(e.target.value)}
            >
              {otherGarages.length === 0 ? (
                <option value="">Không có garage khác</option>
              ) : (
                otherGarages.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))
              )}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Số lượng chuyển *</label>
            <Input
              type="number"
              min={0.5}
              step="0.5"
              max={row.availableQty}
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Ghi chú</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || otherGarages.length === 0}
            >
              {mutation.isPending ? "Đang chuyển..." : "Xác nhận chuyển kho"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
