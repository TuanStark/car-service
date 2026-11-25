"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Power, Search, X } from "lucide-react";
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
import { useToast } from "@/shared/ui/toast-provider";
import { formatViDate, formatVnd } from "@/shared/utils/format";
import {
  type CouponDiscountType,
  createAdminCoupon,
  fetchAdminCoupons,
  updateAdminCoupon,
} from "../api";

export function PromotionsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "promotions", { page, search: debouncedSearch }],
    queryFn: () =>
      fetchAdminCoupons({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAdminCoupon(id, { isActive }),
    onSuccess: (c) => {
      notifySuccess(
        c.isActive ? `Đã kích hoạt mã ${c.code}` : `Đã tạm ngưng mã ${c.code}`
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] });
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Thao tác thất bại.");
    },
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Khuyến mãi & Mã giảm giá (Voucher)
          </h1>
          <p className="text-xs text-ink-secondary">
            Quản lý mã ưu đãi đặt lịch dịch vụ theo % hoặc số tiền cố định và giới hạn lượt dùng
          </p>
        </div>

        <Button size="md" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo mã khuyến mãi
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Tìm theo mã code hoặc mô tả..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : "Không thể tải danh sách khuyến mãi."
            }
            onRetry={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có mã khuyến mãi nào"
            description="Bấm 'Tạo mã khuyến mãi' để phát hành ưu đãi cho khách hàng."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-surface-subtle text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                  <tr>
                    <th className="px-4 py-3">Mã Code</th>
                    <th className="px-4 py-3">Mức giảm & Điều kiện</th>
                    <th className="px-4 py-3">Thời gian hiệu lực</th>
                    <th className="px-4 py-3 text-right">Đã dùng / Giới hạn</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-subtle/60">
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm font-bold text-brand">
                          {c.code}
                        </div>
                        <div className="text-ink-secondary">{c.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-ink">
                          {c.discountType === "PERCENTAGE"
                            ? `Giảm ${c.discountValue}%`
                            : `Giảm ${formatVnd(c.discountValue)}`}
                        </div>
                        <div className="text-[11px] text-ink-muted">
                          Đơn tối thiểu: {formatVnd(c.minOrderVnd)}
                          {c.maxDiscountVnd
                            ? ` • Tối đa ${formatVnd(c.maxDiscountVnd)}`
                            : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-ink-secondary">
                        {formatViDate(c.startsAt)} → {formatViDate(c.expiresAt)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-ink">
                        {c.usedCount} / {c.usageLimit ?? "∞"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill
                          label={c.isActive ? "Đang chạy" : "Tạm ngưng"}
                          tone={c.isActive ? "success" : "neutral"}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={toggleMutation.isPending}
                          onClick={() =>
                            toggleMutation.mutate({
                              id: c.id,
                              isActive: !c.isActive,
                            })
                          }
                        >
                          <Power className="h-3.5 w-3.5" />
                          {c.isActive ? "Tạm ngưng" : "Kích hoạt"}
                        </Button>
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

      {createOpen && (
        <CreateCouponModal onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}

function CreateCouponModal({ onClose }: { readonly onClose: () => void }) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<CouponDiscountType>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10");
  const [minOrderVnd, setMinOrderVnd] = useState("500000");
  const [usageLimit, setUsageLimit] = useState("100");
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [expiresAt, setExpiresAt] = useState(() =>
    new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
  );

  const mutation = useMutation({
    mutationFn: () =>
      createAdminCoupon({
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderVnd: Number(minOrderVnd || 0),
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        startsAt,
        expiresAt,
      }),
    onSuccess: (c) => {
      notifySuccess(`Đã phát hành mã ${c.code}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] });
      onClose();
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Tạo mã thất bại.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">Tạo Mã khuyến mãi mới</h3>
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
              <label className="mb-1 block text-xs font-semibold text-ink">Mã Code *</label>
              <Input
                required
                placeholder="VD: AUTORA10"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Loại giảm *</label>
              <Select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
              >
                <option value="PERCENTAGE">Theo phần trăm (%)</option>
                <option value="FIXED_VND">Số tiền cố định (VNĐ)</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Mô tả ưu đãi *</label>
            <Input
              required
              placeholder="VD: Giảm 10% gói bảo dưỡng định kỳ"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Giá trị *</label>
              <Input
                type="number"
                min={1}
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Đơn tối thiểu</label>
              <Input
                type="number"
                min={0}
                value={minOrderVnd}
                onChange={(e) => setMinOrderVnd(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Giới hạn lượt</label>
              <Input
                type="number"
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Bắt đầu</label>
              <Input
                type="date"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Hết hạn</label>
              <Input
                type="date"
                required
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang tạo..." : "Phát hành mã"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
