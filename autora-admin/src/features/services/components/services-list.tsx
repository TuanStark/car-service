"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, Power, RotateCcw, Search } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
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
  fetchAdminServices,
  fetchServiceCategories,
  type ServiceProductItem,
  toggleAdminServiceStatus,
} from "../api";
import { CreateServiceModal } from "./create-service-modal";

const BADGE_LABELS: Record<string, string> = {
  BEST_SELLER: "Bán chạy",
  PROMO: "Khuyến mãi",
  NEW: "Mới",
  RECOMMENDED: "Khuyên dùng",
};

export function ServicesListView() {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<ServiceProductItem | null>(
    null
  );

  const debouncedQuery = useDebouncedValue(query, 350);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "service-categories"],
    queryFn: fetchServiceCategories,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "services",
      { page, query: debouncedQuery, categoryId, isActive },
    ],
    queryFn: () =>
      fetchAdminServices({
        page,
        limit: 12,
        query: debouncedQuery,
        categoryId: categoryId || undefined,
        isActive: isActive || undefined,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, nextActive }: { id: string; nextActive: boolean }) =>
      toggleAdminServiceStatus(id, nextActive),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "service", updated.id],
      });
      notifySuccess(
        updated.isActive
          ? `Đã mở bán lại gói "${updated.name}".`
          : `Đã tạm ngưng gói "${updated.name}".`
      );
      setToggleTarget(null);
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError
          ? err.message
          : "Không thể thay đổi trạng thái gói dịch vụ."
      );
    },
  });

  const resetFilters = () => {
    setQuery("");
    setCategoryId("");
    setIsActive("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                placeholder="Tìm tên dịch vụ, mã SKU, từ khóa..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            <Select
              aria-label="Lọc danh mục dịch vụ"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.shortLabel || cat.title}
                </option>
              ))}
            </Select>

            <div className="flex gap-2">
              <Select
                aria-label="Lọc trạng thái mở bán"
                value={isActive}
                onChange={(e) => {
                  setIsActive(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Mọi trạng thái</option>
                <option value="true">Đang mở bán</option>
                <option value="false">Đã tạm ngưng</option>
              </Select>

              <Button
                variant="secondary"
                onClick={resetFilters}
                title="Xóa bộ lọc"
                className="px-3"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Thêm dịch vụ mới
          </Button>
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
                  : "Không thể tải danh mục dịch vụ."
              }
              status={error instanceof ApiError ? error.status : undefined}
              onRetry={() => void refetch()}
            />
          </div>
        )}

        {!isLoading && !isError && data && data.items.length === 0 && (
          <EmptyState
            title="Chưa có gói dịch vụ phù hợp"
            description="Thử thay đổi bộ lọc danh mục hoặc tạo gói dịch vụ mới."
            action={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Thêm dịch vụ mới
              </Button>
            }
          />
        )}

        {!isLoading && !isError && data && data.items.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-subtle text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">
                    <th className="px-5 py-3">Dịch vụ / SKU</th>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3 text-right">Giá bán / Niêm yết</th>
                    <th className="px-4 py-3">Thời gian & Bảo hành</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-surface-subtle/60"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Link
                            href={`/services/${item.id}`}
                            className="font-semibold text-ink hover:text-brand"
                          >
                            {item.name}
                          </Link>
                          {item.badge && (
                            <StatusPill
                              label={BADGE_LABELS[item.badge] ?? item.badge}
                              tone="brand"
                            />
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] font-mono text-ink-muted">
                          {item.sku} • Đã đặt {item.bookedCount} lượt
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-ink-secondary">
                        {item.categoryLabel}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="font-semibold tabular-nums text-ink">
                          {formatVnd(item.priceVnd)}
                        </div>
                        {item.originalPriceVnd &&
                          item.originalPriceVnd > item.priceVnd && (
                            <div className="text-[11px] text-ink-muted">
                              <span className="line-through tabular-nums">
                                {formatVnd(item.originalPriceVnd)}
                              </span>
                              {item.discountPercent ? (
                                <span className="ml-1 font-semibold text-emerald-700">
                                  -{item.discountPercent}%
                                </span>
                              ) : null}
                            </div>
                          )}
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        <div className="font-medium text-ink">
                          {item.estimatedDuration}
                        </div>
                        <div className="text-[11px] text-ink-secondary">
                          {item.warrantyLabel}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusPill
                          label={item.isActive ? "Đang mở bán" : "Tạm ngưng"}
                          tone={item.isActive ? "success" : "warning"}
                        />
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setToggleTarget(item)}
                          >
                            <Power className="h-3.5 w-3.5" />
                            {item.isActive ? "Tạm ngưng" : "Mở bán"}
                          </Button>
                          <Link
                            href={`/services/${item.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-subtle"
                          >
                            <Eye className="h-3.5 w-3.5 text-ink-secondary" />
                            Chi tiết
                          </Link>
                        </div>
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

      <CreateServiceModal
        open={createOpen}
        categories={categories}
        onClose={() => setCreateOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={
          toggleTarget?.isActive
            ? "Tạm ngưng gói dịch vụ?"
            : "Mở bán lại gói dịch vụ?"
        }
        description={
          toggleTarget?.isActive
            ? `Gói "${toggleTarget.name}" sẽ được ẩn khỏi danh mục đặt lịch công khai cho đến khi kích hoạt lại.`
            : `Gói "${toggleTarget?.name ?? ""}" sẽ hiển thị trở lại để khách hàng đặt lịch.`
        }
        confirmLabel={
          toggleTarget?.isActive ? "Xác nhận tạm ngưng" : "Xác nhận mở bán"
        }
        tone={toggleTarget?.isActive ? "danger" : "primary"}
        isPending={toggleMutation.isPending}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => {
          if (!toggleTarget) return;
          toggleMutation.mutate({
            id: toggleTarget.id,
            nextActive: !toggleTarget.isActive,
          });
        }}
      />
    </div>
  );
}

