"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building,
  CheckCircle2,
  PackageCheck,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { fetchAdminGarages } from "@/features/garages/api";
import { fetchAdminParts } from "@/features/inventory/api";
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
import { formatViDateTime, formatVnd } from "@/shared/utils/format";
import {
  createPurchaseOrder,
  createSupplier,
  fetchPurchaseOrders,
  fetchSuppliers,
  type PurchaseOrderDto,
  type PurchaseOrderStatus,
  receivePurchaseOrder,
  updatePurchaseOrderStatus,
} from "../api";

const PO_STATUS_META: Record<
  PurchaseOrderStatus,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  DRAFT: { label: "Nháp", tone: "neutral" },
  ORDERED: { label: "Đã đặt hàng", tone: "info" },
  PARTIALLY_RECEIVED: { label: "Nhập một phần", tone: "warning" },
  RECEIVED: { label: "Đã nhập kho đủ", tone: "success" },
  CANCELLED: { label: "Đã hủy", tone: "danger" },
};

export function ProcurementView() {
  const [tab, setTab] = useState<"PO" | "SUPPLIERS">("PO");
  const [poPage, setPoPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "">("");
  const [createPoOpen, setCreatePoOpen] = useState(false);
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrderDto | null>(null);

  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const { data: garagesData } = useQuery({
    queryKey: ["admin", "garages", "procurement"],
    queryFn: () => fetchAdminGarages({ page: 1, limit: 50 }),
  });

  const { data: suppliersData, isLoading: loadingSup } = useQuery({
    queryKey: ["admin", "suppliers"],
    queryFn: () => fetchSuppliers({ page: 1, limit: 50 }),
  });

  const { data: partsData } = useQuery({
    queryKey: ["admin", "parts", "procurement"],
    queryFn: () => fetchAdminParts({ page: 1, limit: 100 }),
  });

  const { data: poData, isLoading: loadingPo, isError, error, refetch } = useQuery({
    queryKey: ["admin", "purchase-orders", { poPage, statusFilter }],
    queryFn: () =>
      fetchPurchaseOrders({
        page: poPage,
        limit: 15,
        status: statusFilter || undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      updatePurchaseOrderStatus(id, status),
    onSuccess: (po) => {
      notifySuccess(`Đã cập nhật PO ${po.poCode} → ${PO_STATUS_META[po.status].label}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "purchase-orders"] });
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError
          ? err.message
          : "Cập nhật trạng thái thất bại. Vui lòng thử lại."
      );
    },
  });

  const garages = garagesData?.items ?? [];
  const suppliers = suppliersData?.items ?? [];
  const parts = partsData?.items ?? [];
  const orders = poData?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Nhập hàng & Nhà cung cấp (PO / COGS)
          </h1>
          <p className="text-xs text-ink-secondary">
            Quản lý đơn nhập hàng từ nhà cung cấp và tự động cập nhật Giá vốn bình quân (WAC) khi nhập kho
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setCreateSupplierOpen(true)}
          >
            <Building className="h-4 w-4" />
            Thêm Nhà cung cấp
          </Button>
          <Button size="md" onClick={() => setCreatePoOpen(true)}>
            <Plus className="h-4 w-4" />
            Tạo Đơn nhập hàng (PO)
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line">
        <button
          type="button"
          onClick={() => setTab("PO")}
          className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            tab === "PO"
              ? "border-brand text-brand"
              : "border-transparent text-ink-secondary hover:text-ink"
          }`}
        >
          Đơn nhập hàng (PO) ({poData?.meta.totalItems ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setTab("SUPPLIERS")}
          className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            tab === "SUPPLIERS"
              ? "border-brand text-brand"
              : "border-transparent text-ink-secondary hover:text-ink"
          }`}
        >
          Nhà cung cấp ({suppliers.length})
        </button>
      </div>

      {tab === "PO" ? (
        <>
          <Card className="p-4">
            <div className="max-w-xs">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as PurchaseOrderStatus | "");
                  setPoPage(1);
                }}
              >
                <option value="">Tất cả trạng thái PO</option>
                {Object.entries(PO_STATUS_META).map(([k, m]) => (
                  <option key={k} value={k}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          <Card className="overflow-hidden">
            {loadingPo ? (
              <TableSkeleton rows={5} cols={6} />
            ) : isError ? (
              <ErrorState
                message={
                  error instanceof ApiError
                    ? error.message
                    : "Không thể tải danh sách đơn nhập hàng."
                }
                onRetry={() => void refetch()}
              />
            ) : orders.length === 0 ? (
              <EmptyState
                title="Chưa có đơn nhập hàng nào"
                description="Bấm 'Tạo Đơn nhập hàng (PO)' để đặt phụ tùng từ nhà cung cấp."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-line bg-surface-subtle text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                      <tr>
                        <th className="px-4 py-3">Mã PO / Ngày tạo</th>
                        <th className="px-4 py-3">Nhà cung cấp</th>
                        <th className="px-4 py-3">Garage nhận</th>
                        <th className="px-4 py-3">Chi tiết mặt hàng</th>
                        <th className="px-4 py-3 text-right">Tổng giá trị</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {orders.map((po) => {
                        const meta = PO_STATUS_META[po.status];
                        return (
                          <tr key={po.id} className="hover:bg-surface-subtle/60">
                            <td className="px-4 py-3">
                              <div className="font-mono font-bold text-brand">
                                {po.poCode}
                              </div>
                              <div className="text-[11px] text-ink-muted">
                                {formatViDateTime(po.createdAt)}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium text-ink">
                              {po.supplierName}
                            </td>
                            <td className="px-4 py-3 text-ink-secondary">
                              {po.garageName}
                            </td>
                            <td className="px-4 py-3">
                              <ul className="space-y-0.5 text-[11px]">
                                {po.items.map((it) => (
                                  <li key={it.id} className="text-ink-secondary">
                                    <span className="font-mono font-semibold text-ink">
                                      {it.sku}
                                    </span>{" "}
                                    — Đã nhận {it.receivedQty}/{it.orderedQty}{" "}
                                    {it.unit} ({formatVnd(it.unitCostVnd)})
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-ink">
                              {formatVnd(po.totalCostVnd)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill label={meta.label} tone={meta.tone} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {po.status === "DRAFT" && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={statusMutation.isPending}
                                    onClick={() =>
                                      statusMutation.mutate({
                                        id: po.id,
                                        status: "ORDERED",
                                      })
                                    }
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                    Gửi đặt hàng
                                  </Button>
                                )}
                                {(po.status === "ORDERED" ||
                                  po.status === "PARTIALLY_RECEIVED") && (
                                  <Button
                                    size="sm"
                                    onClick={() => setReceiveTarget(po)}
                                  >
                                    <PackageCheck className="h-3.5 w-3.5" />
                                    Nhập kho
                                  </Button>
                                )}
                                {(po.status === "DRAFT" ||
                                  po.status === "ORDERED") && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={statusMutation.isPending}
                                    onClick={() =>
                                      statusMutation.mutate({
                                        id: po.id,
                                        status: "CANCELLED",
                                      })
                                    }
                                  >
                                    Hủy
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {poData?.meta && (
                  <div className="border-t border-line px-4 py-3">
                    <Pagination meta={poData.meta} onPageChange={setPoPage} />
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      ) : (
        <Card className="overflow-hidden">
          {loadingSup ? (
            <TableSkeleton rows={4} cols={5} />
          ) : suppliers.length === 0 ? (
            <EmptyState
              title="Chưa có nhà cung cấp nào"
              description="Thêm nhà cung cấp để tạo đơn nhập hàng (PO)."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-surface-subtle text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                  <tr>
                    <th className="px-4 py-3">Mã NCC</th>
                    <th className="px-4 py-3">Tên Nhà cung cấp</th>
                    <th className="px-4 py-3">Liên hệ</th>
                    <th className="px-4 py-3">Điều khoản thanh toán</th>
                    <th className="px-4 py-3">Địa chỉ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-subtle/60">
                      <td className="px-4 py-3 font-mono font-bold text-brand">
                        {s.code}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {s.name}
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">
                        <div>{s.phone ?? "—"}</div>
                        <div className="text-[11px]">{s.email ?? ""}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">
                        {s.paymentTerms ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">
                        {s.address ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {createSupplierOpen && (
        <CreateSupplierModal onClose={() => setCreateSupplierOpen(false)} />
      )}

      {createPoOpen && (
        <CreatePoModal
          garages={garages}
          suppliers={suppliers}
          parts={parts}
          onClose={() => setCreatePoOpen(false)}
        />
      )}

      {receiveTarget && (
        <ReceivePoModal
          po={receiveTarget}
          onClose={() => setReceiveTarget(null)}
        />
      )}
    </div>
  );
}

function CreateSupplierModal({ onClose }: { readonly onClose: () => void }) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Công nợ 30 ngày");

  const mutation = useMutation({
    mutationFn: () =>
      createSupplier({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        paymentTerms: paymentTerms.trim() || undefined,
      }),
    onSuccess: (s) => {
      notifySuccess(`Đã thêm Nhà cung cấp ${s.code} — ${s.name}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
      onClose();
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError ? err.message : "Không thể tạo NCC. Vui lòng kiểm tra lại."
      );
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">Thêm Nhà cung cấp (NCC)</h3>
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
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Mã NCC *</label>
            <Input
              required
              placeholder="VD: NCC-MICHELIN-VN"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Tên Nhà cung cấp *</label>
            <Input
              required
              placeholder="VD: Công ty TNHH Phân phối Lốp Michelin"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Số điện thoại</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Điều khoản thanh toán</label>
            <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Địa chỉ</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang lưu..." : "Lưu Nhà cung cấp"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreatePoModal({
  garages,
  suppliers,
  parts,
  onClose,
}: {
  readonly garages: readonly { id: string; name: string }[];
  readonly suppliers: readonly { id: string; code: string; name: string }[];
  readonly parts: readonly { id: string; sku: string; name: string; unit: string; avgCostVnd: number }[];
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [garageId, setGarageId] = useState(garages[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<
    { partItemId: string; orderedQty: string; unitCostVnd: string }[]
  >(() =>
    parts[0]
      ? [
          {
            partItemId: parts[0].id,
            orderedQty: "10",
            unitCostVnd: String(parts[0].avgCostVnd),
          },
        ]
      : []
  );

  const mutation = useMutation({
    mutationFn: () =>
      createPurchaseOrder({
        supplierId,
        garageId,
        notes: notes.trim() || undefined,
        items: lines.map((l) => ({
          partItemId: l.partItemId,
          orderedQty: Number(l.orderedQty),
          unitCostVnd: Number(l.unitCostVnd),
        })),
      }),
    onSuccess: (po) => {
      notifySuccess(`Đã tạo Đơn nhập hàng — Mã PO: ${po.poCode}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "purchase-orders"] });
      onClose();
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError
          ? err.message
          : "Tạo PO thất bại. Vui lòng kiểm tra lại dữ liệu."
      );
    },
  });

  const totalEstimate = lines.reduce(
    (s, l) => s + Number(l.orderedQty || 0) * Number(l.unitCostVnd || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">Tạo Đơn nhập hàng (PO)</h3>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-4 space-y-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Nhà cung cấp *</label>
              <Select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Nhập về Garage *</label>
              <Select
                required
                value={garageId}
                onChange={(e) => setGarageId(e.target.value)}
              >
                {garages.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink">Danh sách phụ tùng nhập</label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  const first = parts[0];
                  if (!first) return;
                  setLines((prev) => [
                    ...prev,
                    {
                      partItemId: first.id,
                      orderedQty: "5",
                      unitCostVnd: String(first.avgCostVnd),
                    },
                  ]);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm dòng
              </Button>
            </div>

            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 items-center gap-2 rounded-lg border border-line bg-surface-subtle p-2"
                >
                  <div className="col-span-6">
                    <Select
                      value={line.partItemId}
                      onChange={(e) => {
                        const part = parts.find((p) => p.id === e.target.value);
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === idx
                              ? {
                                  ...l,
                                  partItemId: e.target.value,
                                  unitCostVnd: part
                                    ? String(part.avgCostVnd)
                                    : l.unitCostVnd,
                                }
                              : l
                          )
                        );
                      }}
                    >
                      {parts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name} ({p.unit})
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={0.5}
                      step="0.5"
                      required
                      placeholder="SL"
                      value={line.orderedQty}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === idx ? { ...l, orderedQty: e.target.value } : l
                          )
                        )
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min={0}
                      required
                      placeholder="Đơn giá nhập"
                      value={line.unitCostVnd}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === idx ? { ...l, unitCostVnd: e.target.value } : l
                          )
                        )
                      }
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setLines((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-danger hover:opacity-80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Ghi chú PO</label>
            <Input
              placeholder="VD: Nhập định kỳ tháng 11"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between border-t border-line pt-3">
            <span className="text-xs font-semibold text-ink-secondary">
              Tổng giá trị dự kiến:{" "}
              <strong className="font-mono text-sm text-brand">
                {formatVnd(totalEstimate)}
              </strong>
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || lines.length === 0}
              >
                {mutation.isPending ? "Đang tạo..." : "Tạo Đơn PO"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReceivePoModal({
  po,
  onClose,
}: {
  readonly po: PurchaseOrderDto;
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [qtys, setQtys] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      po.items.map((it) => [
        it.id,
        String(Math.max(0, it.orderedQty - it.receivedQty)),
      ])
    )
  );

  const mutation = useMutation({
    mutationFn: () =>
      receivePurchaseOrder(
        po.id,
        po.items
          .map((it) => ({
            purchaseOrderItemId: it.id,
            receivedQty: Number(qtys[it.id] ?? 0),
          }))
          .filter((x) => x.receivedQty > 0)
      ),
    onSuccess: (updated) => {
      notifySuccess(
        `Đã nhập kho từ PO ${updated.poCode} — Tồn kho & Giá vốn BQ đã được cập nhật.`
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "purchase-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      onClose();
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError
          ? err.message
          : "Nhập kho thất bại. Vui lòng kiểm tra lại số lượng."
      );
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">
            Xác nhận Nhập kho — {po.poCode}
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
          <p className="text-xs text-ink-secondary">
            Nhập số lượng thực nhận cho <strong>{po.garageName}</strong>. Hệ thống sẽ tự động tính lại{" "}
            <strong>Giá vốn bình quân gia quyền (WAC)</strong> và ghi Thẻ kho.
          </p>

          <div className="space-y-2">
            {po.items.map((it) => {
              const remaining = Math.max(0, it.orderedQty - it.receivedQty);
              return (
                <div
                  key={it.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-subtle p-3 text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-brand">{it.sku}</div>
                    <div className="font-semibold text-ink">{it.partName}</div>
                    <div className="text-[11px] text-ink-muted">
                      Còn chờ nhận: {remaining} {it.unit} · Đơn giá:{" "}
                      {formatVnd(it.unitCostVnd)}
                    </div>
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      min={0}
                      max={remaining}
                      step="0.5"
                      value={qtys[it.id] ?? "0"}
                      onChange={(e) =>
                        setQtys((prev) => ({ ...prev, [it.id]: e.target.value }))
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              {mutation.isPending ? "Đang nhập kho..." : "Xác nhận nhập kho"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
