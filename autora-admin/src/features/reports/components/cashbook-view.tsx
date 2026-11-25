"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { fetchAdminGarages } from "@/features/garages/api";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  EmptyState,
  ErrorState,
  Pagination,
  TableSkeleton,
} from "@/shared/ui/feedback";
import { ImageUploadField } from "@/shared/ui/image-upload";
import { Input, Select } from "@/shared/ui/input";
import { StatusPill } from "@/shared/ui/status-badge";
import { useToast } from "@/shared/ui/toast-provider";
import { formatViDate, formatVnd } from "@/shared/utils/format";
import {
  createExpense,
  deleteExpense,
  type ExpenseCategory,
  fetchExpenses,
} from "../api";

const EXPENSE_LABELS: Record<ExpenseCategory, string> = {
  RENT_UTILITIES: "Mặt bằng & Điện nước",
  BASE_SALARY: "Lương nhân sự",
  SUPPLIER_PAYMENT: "Thanh toán công nợ NCC",
  EQUIPMENT_MAINT: "Bảo trì thiết bị xưởng",
  WASTE_DISPOSAL: "Xử lý chất thải & Dầu thải",
  MARKETING: "Quảng cáo & CSKH",
  OTHER: "Chi phí khác",
};

export function CashbookView() {
  const [page, setPage] = useState(1);
  const [garageId, setGarageId] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [createOpen, setCreateOpen] = useState(false);

  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const { data: garagesData } = useQuery({
    queryKey: ["admin", "garages", "cashbook"],
    queryFn: () => fetchAdminGarages({ page: 1, limit: 50 }),
  });
  const garages = garagesData?.items ?? [];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "reports", "expenses", { page, garageId, category }],
    queryFn: () =>
      fetchExpenses({
        page,
        limit: 20,
        garageId: garageId || undefined,
        category: category || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      notifySuccess("Đã xóa phiếu chi");
      void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Không thể xóa phiếu chi.");
    },
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Sổ quỹ Chi phí Vận hành (Cashbook)
          </h1>
          <p className="text-xs text-ink-secondary">
            Ghi nhận chi mặt bằng, lương cứng, thanh toán công nợ NCC và chứng từ hóa đơn Cloudinary
          </p>
        </div>

        <Button size="md" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Lập phiếu chi
        </Button>
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
            {garages.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>

          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as ExpenseCategory | "");
              setPage(1);
            }}
          >
            <option value="">Tất cả khoản mục chi</option>
            {Object.entries(EXPENSE_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </Select>
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
                : "Không thể tải sổ quỹ chi phí."
            }
            onRetry={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có phiếu chi nào"
            description="Bấm 'Lập phiếu chi' để ghi nhận chi phí vận hành xưởng."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-surface-subtle text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                  <tr>
                    <th className="px-4 py-3">Ngày chi / Mã chứng từ</th>
                    <th className="px-4 py-3">Garage</th>
                    <th className="px-4 py-3">Khoản mục</th>
                    <th className="px-4 py-3">Nội dung chi</th>
                    <th className="px-4 py-3 text-right">Số tiền</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((e) => (
                    <tr key={e.id} className="hover:bg-surface-subtle/60">
                      <td className="px-4 py-3">
                        <div className="font-mono text-ink">
                          {formatViDate(e.occurredAt)}
                        </div>
                        {e.referenceCode && (
                          <div className="font-mono text-[11px] text-brand">
                            {e.referenceCode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">
                        {e.garageName}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill
                          label={EXPENSE_LABELS[e.category]}
                          tone="neutral"
                        />
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">
                        <div className="text-ink">{e.description}</div>
                        {e.recordedByEmail && (
                          <div className="text-[11px] text-ink-muted">
                            Lập bởi: {e.recordedByEmail}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-danger">
                        -{formatVnd(e.amountVnd)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(e.id)}
                          className="text-danger hover:opacity-80"
                          title="Xóa phiếu chi"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
        <CreateExpenseModal
          garages={garages}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}

function CreateExpenseModal({
  garages,
  onClose,
}: {
  readonly garages: readonly { id: string; name: string }[];
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [garageId, setGarageId] = useState(garages[0]?.id ?? "");
  const [category, setCategory] = useState<ExpenseCategory>("RENT_UTILITIES");
  const [amountVnd, setAmountVnd] = useState("2000000");
  const [occurredAt, setOccurredAt] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [referenceCode, setReferenceCode] = useState("");
  const [description, setDescription] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createExpense({
        garageId,
        category,
        amountVnd: Number(amountVnd),
        occurredAt,
        referenceCode: referenceCode.trim() || undefined,
        description: description.trim(),
        receiptUrl: receiptUrl.trim() || undefined,
      }),
    onSuccess: () => {
      notifySuccess("Đã ghi nhận phiếu chi vào sổ quỹ");
      void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      onClose();
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Lập phiếu chi thất bại.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">Lập Phiếu chi Vận hành</h3>
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
              <label className="mb-1 block text-xs font-semibold text-ink">Garage *</label>
              <Select required value={garageId} onChange={(e) => setGarageId(e.target.value)}>
                {garages.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Khoản mục *</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              >
                {Object.entries(EXPENSE_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Số tiền (VNĐ) *</label>
              <Input
                type="number"
                min={1000}
                required
                value={amountVnd}
                onChange={(e) => setAmountVnd(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Ngày chi *</label>
              <Input
                type="date"
                required
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Mã chứng từ</label>
              <Input
                placeholder="VD: PC-1105"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Nội dung chi *</label>
            <Input
              required
              placeholder="VD: Thanh toán tiền điện 3 pha tháng 11"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <ImageUploadField
            label="Ảnh chứng từ / Hóa đơn (tùy chọn)"
            value={receiptUrl}
            onChange={setReceiptUrl}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang lưu..." : "Lưu phiếu chi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
