"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  RotateCcw,
  Search,
  UserCheck,
  Wrench,
  X,
} from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { fetchAdminGarages } from "@/features/garages/api";
import { fetchAdminStaff } from "@/features/workforce/api";
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
  checkoutEquipmentTool,
  createAdminEquipment,
  type EquipmentCategory,
  type EquipmentItemDto,
  type EquipmentMaintenanceType,
  type EquipmentStatus,
  fetchAdminEquipment,
  recordEquipmentMaintenance,
  returnEquipmentTool,
  type ToolReturnCondition,
  updateAdminEquipment,
} from "../api";

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  LIFT: "Cầu nâng",
  DIAGNOSTIC_SCANNER: "Máy chẩn đoán",
  WHEEL_ALIGNMENT: "Cân chỉnh thước lái",
  AC_MACHINE: "Máy điều hòa",
  PAINT_BOOTH: "Phòng sơn",
  SPECIAL_TOOL: "Dụng cụ chuyên dụng",
};

const STATUS_META: Record<
  EquipmentStatus,
  { label: string; tone: "success" | "info" | "warning" | "danger" }
> = {
  OPERATIONAL: { label: "Sẵn sàng", tone: "success" },
  IN_USE: { label: "Đang sử dụng / Mượn", tone: "info" },
  MAINTENANCE: { label: "Đang bảo trì", tone: "warning" },
  BROKEN: { label: "Hư hỏng", tone: "danger" },
};

export function EquipmentView() {
  const [tab, setTab] = useState<"ALL" | "CHECKED_OUT" | "DUE_SOON">("ALL");
  const [page, setPage] = useState(1);
  const [garageId, setGarageId] = useState("");
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<EquipmentItemDto | null>(null);
  const [returnTarget, setReturnTarget] = useState<EquipmentItemDto | null>(null);
  const [maintTarget, setMaintTarget] = useState<EquipmentItemDto | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const { data: garagesData } = useQuery({
    queryKey: ["admin", "garages", "equipment"],
    queryFn: () => fetchAdminGarages({ page: 1, limit: 50 }),
  });
  const garages = garagesData?.items ?? [];

  const { data: staffData } = useQuery({
    queryKey: ["admin", "staff", "tech-select"],
    queryFn: () => fetchAdminStaff({ page: 1, limit: 50, roleCode: "technician" }),
  });
  const technicians = staffData?.items ?? [];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "equipment",
      { page, garageId, tab, search: debouncedSearch },
    ],
    queryFn: () =>
      fetchAdminEquipment({
        page,
        limit: 20,
        garageId: garageId || undefined,
        checkedOutOnly: tab === "CHECKED_OUT",
        dueSoonOnly: tab === "DUE_SOON",
        search: debouncedSearch || undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EquipmentStatus }) =>
      updateAdminEquipment(id, { status }),
    onSuccess: (res) => {
      if (res.lockedBayCode) {
        notifySuccess(
          `Đã khóa cầu nâng ${res.lockedBayCode} sang bảo trì` +
            (res.affectedBookingsCount > 0
              ? ` (${res.affectedBookingsCount} lịch hẹn cần dời cầu)`
              : "")
        );
      } else {
        notifySuccess(`Đã cập nhật trạng thái ${res.equipment.assetCode}`);
      }
      void queryClient.invalidateQueries({ queryKey: ["admin", "equipment"] });
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError ? err.message : "Không thể cập nhật trạng thái thiết bị."
      );
    },
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Thiết bị Xưởng & Công cụ Chuyên dụng
          </h1>
          <p className="text-xs text-ink-secondary">
            Theo dõi máy móc, hạn hiệu chuẩn, mượn/trả dụng cụ 1 chạm và tự động khóa cầu nâng khi thiết bị hỏng
          </p>
        </div>

        <Button size="md" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Thêm thiết bị / công cụ
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line">
        <button
          type="button"
          onClick={() => {
            setTab("ALL");
            setPage(1);
          }}
          className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            tab === "ALL"
              ? "border-brand text-brand"
              : "border-transparent text-ink-secondary hover:text-ink"
          }`}
        >
          Tất cả thiết bị
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("CHECKED_OUT");
            setPage(1);
          }}
          className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            tab === "CHECKED_OUT"
              ? "border-brand text-brand"
              : "border-transparent text-ink-secondary hover:text-ink"
          }`}
        >
          Đang được KTV mượn
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("DUE_SOON");
            setPage(1);
          }}
          className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
            tab === "DUE_SOON"
              ? "border-brand text-brand"
              : "border-transparent text-ink-secondary hover:text-ink"
          }`}
        >
          Sắp đến hạn hiệu chuẩn / bảo trì
        </button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              className="pl-9"
              placeholder="Tìm theo mã tài sản, tên thiết bị, model..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="md:col-span-6">
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
        </div>
      </Card>

      {/* Equipment Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : "Không thể tải danh sách thiết bị."
            }
            onRetry={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có thiết bị phù hợp"
            description="Hãy thêm thiết bị mới hoặc chuyển tab để xem danh sách."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-surface-subtle text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                  <tr>
                    <th className="px-4 py-3">Mã / Tên thiết bị</th>
                    <th className="px-4 py-3">Loại & Garage</th>
                    <th className="px-4 py-3">Hạn bảo trì / Hiệu chuẩn</th>
                    <th className="px-4 py-3">Trạng thái & Người mượn</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((eq) => {
                    const meta = STATUS_META[eq.status];
                    return (
                      <tr key={eq.id} className="hover:bg-surface-subtle/60">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-brand">
                            {eq.assetCode}
                          </div>
                          <div className="font-semibold text-ink">{eq.name}</div>
                          {eq.brandModel && (
                            <div className="text-[11px] text-ink-muted">
                              Model: {eq.brandModel}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink">
                            {CATEGORY_LABELS[eq.category]}
                          </div>
                          <div className="text-[11px] text-ink-secondary">
                            {eq.garageName}
                            {eq.serviceBayCode ? ` • Cầu ${eq.serviceBayCode}` : ""}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5 text-[11px]">
                            {eq.calibrationDueAt && (
                              <div className="text-ink-secondary">
                                Hiệu chuẩn: {formatViDate(eq.calibrationDueAt)}
                              </div>
                            )}
                            {eq.nextMaintenanceAt && (
                              <div className="text-ink-secondary">
                                Bảo trì: {formatViDate(eq.nextMaintenanceAt)}
                              </div>
                            )}
                            {eq.isDueSoon && (
                              <span className="inline-flex items-center gap-1 font-semibold text-warning">
                                <AlertTriangle className="h-3 w-3" />
                                Sắp đến hạn (≤ 7 ngày)
                              </span>
                            )}
                            {!eq.calibrationDueAt && !eq.nextMaintenanceAt && "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 space-y-1">
                          <StatusPill label={meta.label} tone={meta.tone} />
                          {eq.activeCheckout && (
                            <div className="text-[11px] text-ink-secondary">
                              KTV: <strong>{eq.activeCheckout.technicianName}</strong>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            {eq.activeCheckout ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setReturnTarget(eq)}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Trả dụng cụ
                              </Button>
                            ) : (
                              eq.status === "OPERATIONAL" && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setCheckoutTarget(eq)}
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                  Mượn
                                </Button>
                              )
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setMaintTarget(eq)}
                            >
                              <Wrench className="h-3.5 w-3.5" />
                              Bảo trì
                            </Button>
                            {eq.status === "OPERATIONAL" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={statusMutation.isPending}
                                onClick={() =>
                                  statusMutation.mutate({
                                    id: eq.id,
                                    status: "MAINTENANCE",
                                  })
                                }
                              >
                                Báo hỏng/Khóa
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

            {data?.meta && (
              <div className="border-t border-line px-4 py-3">
                <Pagination meta={data.meta} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>

      {createOpen && (
        <CreateEquipmentModal
          garages={garages}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {checkoutTarget && (
        <CheckoutModal
          equipment={checkoutTarget}
          technicians={technicians}
          onClose={() => setCheckoutTarget(null)}
        />
      )}

      {returnTarget && (
        <ReturnModal
          equipment={returnTarget}
          onClose={() => setReturnTarget(null)}
        />
      )}

      {maintTarget && (
        <MaintenanceModal
          equipment={maintTarget}
          onClose={() => setMaintTarget(null)}
        />
      )}
    </div>
  );
}

function CreateEquipmentModal({
  garages,
  onClose,
}: {
  readonly garages: readonly { id: string; name: string }[];
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [garageId, setGarageId] = useState(garages[0]?.id ?? "");
  const [assetCode, setAssetCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<EquipmentCategory>("SPECIAL_TOOL");
  const [brandModel, setBrandModel] = useState("");
  const [purchaseCostVnd, setPurchaseCostVnd] = useState("15000000");

  const mutation = useMutation({
    mutationFn: () =>
      createAdminEquipment({
        garageId,
        assetCode: assetCode.trim().toUpperCase(),
        name: name.trim(),
        category,
        brandModel: brandModel.trim() || undefined,
        purchaseCostVnd: Number(purchaseCostVnd || 0),
      }),
    onSuccess: (eq) => {
      notifySuccess(`Đã thêm thiết bị ${eq.assetCode} — ${eq.name}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "equipment"] });
      onClose();
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError ? err.message : "Không thể thêm thiết bị."
      );
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">Thêm Thiết bị / Công cụ mới</h3>
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
            <label className="mb-1 block text-xs font-semibold text-ink">Garage *</label>
            <Select required value={garageId} onChange={(e) => setGarageId(e.target.value)}>
              {garages.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Mã tài sản *</label>
              <Input
                required
                placeholder="VD: TL-DIAG-02"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Loại thiết bị *</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
              >
                {Object.entries(CATEGORY_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Tên thiết bị *</label>
            <Input
              required
              placeholder="VD: Đồng hồ đo áp suất nén buồng đốt"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Hãng / Model</label>
              <Input value={brandModel} onChange={(e) => setBrandModel(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Nguyên giá (VNĐ)</label>
              <Input
                type="number"
                min={0}
                value={purchaseCostVnd}
                onChange={(e) => setPurchaseCostVnd(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang lưu..." : "Lưu thiết bị"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CheckoutModal({
  equipment,
  technicians,
  onClose,
}: {
  readonly equipment: EquipmentItemDto;
  readonly technicians: readonly { id: string; fullName: string; email: string }[];
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [techId, setTechId] = useState(technicians[0]?.id ?? "");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      checkoutEquipmentTool(equipment.id, {
        technicianUserId: techId,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      notifySuccess(`Đã xuất mượn ${equipment.assetCode}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "equipment"] });
      onClose();
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Xuất mượn thất bại.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">Xuất mượn dụng cụ</h3>
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
            <strong className="text-brand">{equipment.assetCode}</strong> —{" "}
            <span className="font-semibold text-ink">{equipment.name}</span>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Kỹ thuật viên mượn *</label>
            <Select required value={techId} onChange={(e) => setTechId(e.target.value)}>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.email})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Ghi chú</label>
            <Input
              placeholder="VD: Dùng cho xe 51K-682.39"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending || !techId}>
              Xác nhận cho mượn
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReturnModal({
  equipment,
  onClose,
}: {
  readonly equipment: EquipmentItemDto;
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [condition, setCondition] = useState<ToolReturnCondition>("GOOD");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      returnEquipmentTool(equipment.id, {
        returnCondition: condition,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      notifySuccess(`Đã nhận trả ${equipment.assetCode}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "equipment"] });
      onClose();
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Trả dụng cụ thất bại.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">Xác nhận Trả dụng cụ</h3>
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
            <div>
              <strong className="text-brand">{equipment.assetCode}</strong> — {equipment.name}
            </div>
            {equipment.activeCheckout && (
              <div className="mt-1 text-ink-secondary">
                Người đang mượn: <strong>{equipment.activeCheckout.technicianName}</strong>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Tình trạng khi trả *</label>
            <Select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ToolReturnCondition)}
            >
              <option value="GOOD">Tốt (Bình thường — Sẵn sàng sử dụng)</option>
              <option value="DAMAGED">Hư hỏng (Tự khóa thiết bị)</option>
              <option value="MISSING">Thất lạc / Thiếu phụ kiện</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Ghi chú bàn giao</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              Xác nhận trả kho
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MaintenanceModal({
  equipment,
  onClose,
}: {
  readonly equipment: EquipmentItemDto;
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [maintenanceType, setMaintenanceType] =
    useState<EquipmentMaintenanceType>("CALIBRATION");
  const [costVnd, setCostVnd] = useState("1000000");
  const [vendorName, setVendorName] = useState("");
  const [nextDueAt, setNextDueAt] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      recordEquipmentMaintenance(equipment.id, {
        maintenanceType,
        costVnd: Number(costVnd || 0),
        vendorName: vendorName.trim() || undefined,
        nextDueAt: nextDueAt || undefined,
        notes: notes.trim() || undefined,
        restoreOperational: true,
      }),
    onSuccess: () => {
      notifySuccess(
        `Đã lưu nhật ký bảo trì/hiệu chuẩn ${equipment.assetCode} (${formatVnd(Number(costVnd || 0))})`
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "equipment"] });
      onClose();
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Lưu nhật ký thất bại.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">
            Ghi nhận Bảo trì / Hiệu chuẩn
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Loại *</label>
              <Select
                value={maintenanceType}
                onChange={(e) =>
                  setMaintenanceType(e.target.value as EquipmentMaintenanceType)
                }
              >
                <option value="CALIBRATION">Hiệu chuẩn</option>
                <option value="ROUTINE">Bảo trì định kỳ</option>
                <option value="REPAIR">Sửa chữa sự cố</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Chi phí (VNĐ)</label>
              <Input
                type="number"
                min={0}
                value={costVnd}
                onChange={(e) => setCostVnd(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Đơn vị thực hiện</label>
              <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Hạn kỳ tiếp theo</label>
              <Input
                type="date"
                value={nextDueAt}
                onChange={(e) => setNextDueAt(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Nội dung thực hiện</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Lưu & Mở sẵn sàng
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

