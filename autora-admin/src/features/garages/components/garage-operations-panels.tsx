"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2, Wrench } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { fetchAdminServices } from "@/features/services/api";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { Input, Select } from "@/shared/ui/input";
import { StatusPill } from "@/shared/ui/status-badge";
import { useToast } from "@/shared/ui/toast-provider";
import { formatVnd } from "@/shared/utils/format";
import {
  createGarageBay,
  deleteGarageBay,
  type GarageBay,
  type GarageDetail,
  syncGarageServices,
  updateGarageBay,
} from "../api";

const BAY_TYPE_LABELS: Record<GarageBay["bayType"], string> = {
  QUICK_SERVICE: "Bảo dưỡng nhanh",
  TWO_POST: "Cầu 2 trụ gầm-máy",
  ALIGNMENT_3D: "Cân chỉnh 3D",
  DETAILING: "Khoang Detailing",
};

export function GarageBaysCard({
  garage,
}: {
  readonly garage: GarageDetail;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [bayType, setBayType] = useState<GarageBay["bayType"]>("TWO_POST");

  const addMutation = useMutation({
    mutationFn: () =>
      createGarageBay(garage.id, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        bayType,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "garage", garage.id], updated);
      setAdding(false);
      setCode("");
      setName("");
      notifySuccess("Đã thêm cầu nâng mới cho xưởng.");
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError ? err.message : "Không thể thêm cầu nâng."
      );
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({
      bayId,
      status,
    }: {
      bayId: string;
      status: GarageBay["status"];
    }) => updateGarageBay(garage.id, bayId, { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "garage", garage.id], updated);
      notifySuccess("Đã cập nhật trạng thái cầu nâng.");
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError ? err.message : "Không thể đổi trạng thái cầu."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (bayId: string) => deleteGarageBay(garage.id, bayId),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "garage", garage.id], updated);
      notifySuccess("Đã xóa cầu nâng.");
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError ? err.message : "Không thể xóa cầu nâng."
      );
    },
  });

  return (
    <Card>
      <CardHeader
        title="Danh sách Cầu nâng & Khoang thi công"
        description={`${garage.bays.length} cầu nâng đang quản lý`}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAdding((prev) => !prev)}
          >
            <Plus className="h-3.5 w-3.5" />
            Thêm cầu nâng
          </Button>
        }
      />

      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addMutation.mutate();
          }}
          className="grid grid-cols-1 gap-3 border-b border-line bg-surface-subtle/60 p-4 sm:grid-cols-4"
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Mã (VD: BAY-05)"
            required
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên cầu nâng"
            required
          />
          <Select
            value={bayType}
            onChange={(e) =>
              setBayType(e.target.value as GarageBay["bayType"])
            }
          >
            <option value="QUICK_SERVICE">Bảo dưỡng nhanh</option>
            <option value="TWO_POST">Cầu 2 trụ gầm-máy</option>
            <option value="ALIGNMENT_3D">Cân chỉnh 3D</option>
            <option value="DETAILING">Khoang Detailing</option>
          </Select>
          <Button type="submit" size="sm" disabled={addMutation.isPending}>
            {addMutation.isPending ? "Đang lưu..." : "Lưu cầu"}
          </Button>
        </form>
      )}

      <div className="divide-y divide-line">
        {garage.bays.length === 0 ? (
          <p className="p-5 text-xs text-ink-muted">
            Chưa khai báo cầu nâng cụ thể.
          </p>
        ) : (
          garage.bays.map((bay) => (
            <div
              key={bay.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="h-4 w-4 text-brand" />
                <div>
                  <strong className="font-semibold text-ink">
                    {bay.code} — {bay.name}
                  </strong>
                  <span className="block text-[11px] text-ink-secondary">
                    {BAY_TYPE_LABELS[bay.bayType]}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusPill
                  label={
                    bay.status === "MAINTENANCE" ? "Đang bảo trì" : "Sẵn sàng"
                  }
                  tone={bay.status === "MAINTENANCE" ? "danger" : "success"}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={toggleStatusMutation.isPending}
                  onClick={() =>
                    toggleStatusMutation.mutate({
                      bayId: bay.id,
                      status:
                        bay.status === "MAINTENANCE"
                          ? "AVAILABLE"
                          : "MAINTENANCE",
                    })
                  }
                >
                  {bay.status === "MAINTENANCE" ? "Mở lại" : "Báo bảo trì"}
                </Button>
                <button
                  type="button"
                  title="Xóa cầu nâng"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(bay.id)}
                  className="rounded-md p-1.5 text-ink-muted hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function GarageServiceMatrixCard({
  garage,
}: {
  readonly garage: GarageDetail;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [editing, setEditing] = useState(false);

  const { data: allServicesPage } = useQuery({
    queryKey: ["admin", "services", "active-options"],
    queryFn: () =>
      fetchAdminServices({ page: 1, limit: 100, isActive: "true" }),
    enabled: editing,
  });

  const [selectedMap, setSelectedMap] = useState<
    Record<string, { enabled: boolean; customPriceVnd: string }>
  >(() => {
    const initial: Record<string, { enabled: boolean; customPriceVnd: string }> =
      {};
    for (const s of garage.offeredServices) {
      initial[s.serviceProductId] = {
        enabled: true,
        customPriceVnd:
          s.customPriceVnd !== null ? String(s.customPriceVnd) : "",
      };
    }
    return initial;
  });

  const syncMutation = useMutation({
    mutationFn: () => {
      const items = Object.entries(selectedMap)
        .filter(([, cfg]) => cfg.enabled)
        .map(([serviceProductId, cfg]) => ({
          serviceProductId,
          customPriceVnd: cfg.customPriceVnd.trim()
            ? Number.parseInt(cfg.customPriceVnd, 10)
            : null,
          isAvailable: true,
        }));
      return syncGarageServices(garage.id, items);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "garage", garage.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["admin", "garages"] });
      setEditing(false);
      notifySuccess("Đã đồng bộ ma trận dịch vụ & giá riêng cho garage.");
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError
          ? err.message
          : "Không thể đồng bộ bảng giá dịch vụ."
      );
    },
  });

  const allServices = allServicesPage?.items ?? [];

  return (
    <Card>
      <CardHeader
        title="Ma trận Dịch vụ & Giá riêng tại Garage"
        description={`${garage.offeredServices.length} gói đang cung cấp`}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing((prev) => !prev)}
          >
            {editing ? "Hủy chỉnh sửa" : "Cấu hình dịch vụ"}
          </Button>
        }
      />

      {editing ? (
        <div className="space-y-3 p-5">
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {allServices.map((srv) => {
              const cfg = selectedMap[srv.id] ?? {
                enabled: false,
                customPriceVnd: "",
              };
              return (
                <div
                  key={srv.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-xs"
                >
                  <label className="flex min-w-0 flex-1 items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.enabled}
                      onChange={(e) =>
                        setSelectedMap((prev) => ({
                          ...prev,
                          [srv.id]: {
                            ...cfg,
                            enabled: e.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 rounded border-line-strong text-brand"
                    />
                    <span className="truncate font-medium text-ink">
                      {srv.name}{" "}
                      <span className="font-normal text-ink-muted">
                        (Chuẩn: {formatVnd(srv.priceVnd)})
                      </span>
                    </span>
                  </label>

                  {cfg.enabled && (
                    <Input
                      type="number"
                      min={1000}
                      step={1000}
                      value={cfg.customPriceVnd}
                      onChange={(e) =>
                        setSelectedMap((prev) => ({
                          ...prev,
                          [srv.id]: {
                            ...cfg,
                            customPriceVnd: e.target.value,
                          },
                        }))
                      }
                      placeholder="Giá riêng (nếu khác)"
                      className="w-40"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end border-t border-line pt-3">
            <Button
              size="sm"
              disabled={syncMutation.isPending}
              onClick={() => syncMutation.mutate()}
            >
              <Save className="h-3.5 w-3.5" />
              {syncMutation.isPending ? "Đang lưu..." : "Lưu ma trận dịch vụ"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-line">
          {garage.offeredServices.length === 0 ? (
            <p className="p-5 text-xs text-ink-muted">
              Chưa có gói dịch vụ nào được gán cho garage này.
            </p>
          ) : (
            garage.offeredServices.map((srv) => (
              <div
                key={srv.serviceProductId}
                className="flex items-center justify-between gap-3 px-5 py-3 text-xs"
              >
                <div>
                  <span className="font-semibold text-ink">{srv.name}</span>
                  <span className="block text-[11px] text-ink-muted">
                    {srv.sku} • {srv.categoryTitle}
                  </span>
                </div>
                <div className="text-right">
                  <strong className="shrink-0 font-semibold text-brand tabular-nums">
                    {formatVnd(srv.customPriceVnd ?? srv.basePriceVnd)}
                  </strong>
                  {srv.customPriceVnd !== null && (
                    <span className="block text-[10px] text-ink-muted">
                      Giá riêng xưởng
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}

