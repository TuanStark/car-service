"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Plus, Search, X } from "lucide-react";
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
import { Input, Select, Textarea } from "@/shared/ui/input";
import { StatusPill } from "@/shared/ui/status-badge";
import { useToast } from "@/shared/ui/toast-provider";
import { formatViDate, formatVnd } from "@/shared/utils/format";
import {
  createWarrantyClaim,
  fetchAdminWarranties,
  type WarrantyRecordDto,
  type WarrantyRootCause,
  type WarrantyStatus,
} from "../api";

const STATUS_META: Record<
  WarrantyStatus,
  { label: string; tone: "success" | "warning" | "neutral" | "danger" }
> = {
  ACTIVE: { label: "Còn hiệu lực", tone: "success" },
  CLAIMED: { label: "Đang xử lý BH", tone: "warning" },
  EXPIRED: { label: "Hết hạn", tone: "neutral" },
  VOIDED: { label: "Đã hủy", tone: "danger" },
};

const ROOT_CAUSE_LABELS: Record<WarrantyRootCause, string> = {
  WORKMANSHIP: "Lỗi kỹ thuật thi công",
  DEFECTIVE_PART: "Lỗi vật tư / phụ tùng",
  CUSTOMER_MISUSE: "Khách sử dụng sai quy cách",
  OTHER: "Nguyên nhân khác",
};

export function WarrantiesView() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<WarrantyStatus | "">("");
  const [search, setSearch] = useState("");
  const [claimTarget, setClaimTarget] = useState<WarrantyRecordDto | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "warranties", { page, status, search: debouncedSearch }],
    queryFn: () =>
      fetchAdminWarranties({
        page,
        limit: 20,
        status: status || undefined,
        search: debouncedSearch || undefined,
      }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">
          Bảo hành Điện tử & Comeback
        </h1>
        <p className="text-xs text-ink-secondary">
          Tự động cấp khi RO hoàn tất. Tra cứu theo biển số/mã bảo hành và quản lý phiếu xử lý comeback
        </p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-8">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              className="pl-9"
              placeholder="Tìm theo mã bảo hành, biển số xe, tên khách hàng, dịch vụ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="md:col-span-4">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as WarrantyStatus | "");
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_META).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
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
                : "Không thể tải danh sách bảo hành."
            }
            onRetry={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có sổ bảo hành điện tử nào"
            description="Sổ bảo hành sẽ tự động được cấp khi bạn chuyển trạng thái RO sang Hoàn tất (COMPLETED)."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-surface-subtle text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                  <tr>
                    <th className="px-4 py-3">Mã BH / RO</th>
                    <th className="px-4 py-3">Khách hàng & Biển số</th>
                    <th className="px-4 py-3">Dịch vụ bảo hành</th>
                    <th className="px-4 py-3">Hạn BH / ODO</th>
                    <th className="px-4 py-3">Trạng thái & Claim</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((w) => {
                    const meta = STATUS_META[w.status];
                    return (
                      <tr key={w.id} className="hover:bg-surface-subtle/60">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-brand">
                            {w.warrantyCode}
                          </div>
                          <div className="text-[11px] text-ink-muted">
                            RO: {w.bookingOrderCode}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink">{w.customerName}</div>
                          <div className="font-mono text-[11px] text-ink-secondary">
                            {w.licensePlate}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink">{w.serviceNameSnap}</div>
                          <div className="text-[11px] text-ink-secondary">
                            {w.garageName} • {w.warrantyLabel}
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          <div className="text-ink">Đến {formatViDate(w.validUntilDate)}</div>
                          <div className="text-[11px] text-ink-muted">
                            ODO: {new Intl.NumberFormat("vi-VN").format(w.startOdoKm)} →{" "}
                            {w.validUntilOdoKm
                              ? new Intl.NumberFormat("vi-VN").format(w.validUntilOdoKm)
                              : "—"}{" "}
                            km
                          </div>
                        </td>
                        <td className="px-4 py-3 space-y-1">
                          <StatusPill label={meta.label} tone={meta.tone} />
                          {w.claims.map((c) => (
                            <div
                              key={c.id}
                              className="rounded border border-line bg-surface-subtle px-2 py-1 text-[11px]"
                            >
                              <div className="font-semibold text-ink">
                                <AlertCircle className="mr-1 inline h-3 w-3 text-warning" />
                                {ROOT_CAUSE_LABELS[c.rootCause]} ({c.status})
                              </div>
                              <div className="text-ink-secondary">
                                Chi phí nội bộ: {formatVnd(c.internalCostVnd)}
                              </div>
                            </div>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setClaimTarget(w)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Mở phiếu BH
                          </Button>
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

      {claimTarget && (
        <CreateClaimModal
          warranty={claimTarget}
          onClose={() => setClaimTarget(null)}
        />
      )}
    </div>
  );
}

function CreateClaimModal({
  warranty,
  onClose,
}: {
  readonly warranty: WarrantyRecordDto;
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [rootCause, setRootCause] = useState<WarrantyRootCause>("WORKMANSHIP");
  const [internalCostVnd, setInternalCostVnd] = useState("250000");
  const [issueDescription, setIssueDescription] = useState("");
  const [resolution, setResolution] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createWarrantyClaim(warranty.id, {
        rootCause,
        internalCostVnd: Number(internalCostVnd || 0),
        issueDescription: issueDescription.trim(),
        resolution: resolution.trim() || undefined,
      }),
    onSuccess: () => {
      notifySuccess(`Đã mở phiếu bảo hành cho ${warranty.warrantyCode}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "warranties"] });
      onClose();
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Mở phiếu thất bại.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">
            Mở phiếu Bảo hành / Comeback
          </h3>
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
            <strong className="text-brand">{warranty.warrantyCode}</strong> —{" "}
            {warranty.licensePlate} ({warranty.serviceNameSnap})
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Nguyên nhân *</label>
              <Select
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value as WarrantyRootCause)}
              >
                {Object.entries(ROOT_CAUSE_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Chi phí nội bộ (VNĐ)</label>
              <Input
                type="number"
                min={0}
                value={internalCostVnd}
                onChange={(e) => setInternalCostVnd(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Mô tả lỗi phát sinh *</label>
            <Textarea
              required
              rows={3}
              placeholder="VD: Khách phản hồi có tiếng kêu nhẹ ở má phanh trước..."
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Phương án xử lý</label>
            <Input
              placeholder="VD: Vệ sinh lại cùm phanh miễn phí cho khách"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang lưu..." : "Tạo phiếu bảo hành"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

