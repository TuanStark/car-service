"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Plus, Wrench } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { fetchAdminGarages } from "@/features/garages/api";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { EmptyState, ErrorState, TableSkeleton } from "@/shared/ui/feedback";
import { Input, Select } from "@/shared/ui/input";
import { BookingStatusBadge, StatusPill } from "@/shared/ui/status-badge";
import { formatVnd } from "@/shared/utils/format";
import { fetchDispatchSchedule } from "../api";
import { CreateBookingModal } from "./create-booking-modal";

function getDefaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const BAY_TYPE_LABELS: Record<string, string> = {
  QUICK_SERVICE: "Bảo dưỡng nhanh",
  TWO_POST: "Cầu 2 trụ gầm-máy",
  ALIGNMENT_3D: "Cân chỉnh 3D",
  DETAILING: "Detailing",
};

export function DispatchScheduleView() {
  const [date, setDate] = useState(getDefaultDate);
  const [garageId, setGarageId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: garagesPage } = useQuery({
    queryKey: ["admin", "garages", "all-options"],
    queryFn: () => fetchAdminGarages({ page: 1, limit: 50, status: "ACTIVE" }),
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "bookings", "schedule", { date, garageId }],
    queryFn: () =>
      fetchDispatchSchedule({ date, garageId: garageId || undefined }),
  });

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand" />
              <Input
                type="date"
                aria-label="Chọn ngày điều phối"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-44"
              />
            </div>

            <Select
              aria-label="Chọn chi nhánh garage"
              value={garageId}
              onChange={(e) => setGarageId(e.target.value)}
              className="w-64"
            >
              <option value="">Tất cả garage đang hoạt động</option>
              {(garagesPage?.items ?? []).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/bookings"
              className="inline-flex h-9 items-center rounded-lg border border-line-strong bg-surface px-3 text-xs font-semibold text-ink hover:bg-surface-subtle"
            >
              Xem dạng danh sách
            </Link>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Đặt lịch Hotline
            </Button>
          </div>
        </div>
      </Card>

      {isLoading && (
        <Card>
          <TableSkeleton rows={6} cols={4} />
        </Card>
      )}

      {isError && (
        <ErrorState
          message={
            error instanceof ApiError
              ? error.message
              : "Không thể tải lịch điều phối cầu nâng."
          }
          status={error instanceof ApiError ? error.status : undefined}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState
          title="Chưa có garage hoạt động"
          description="Kích hoạt ít nhất một garage để điều phối cầu nâng."
        />
      )}

      {!isLoading &&
        !isError &&
        data?.map((garage) => (
          <Card key={garage.garageId}>
            <CardHeader
              title={garage.garageName}
              description={`Tổng ${garage.bayCount} cầu nâng/khoang khả dụng trong ngày`}
              action={
                <Link
                  href={`/garages/${garage.garageId}`}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Cấu hình cầu nâng →
                </Link>
              }
            />

            {garage.bays.length > 0 && (
              <div className="flex flex-wrap gap-2 border-b border-line bg-surface-subtle/50 px-5 py-3">
                {garage.bays.map((bay) => (
                  <div
                    key={bay.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs"
                  >
                    <Wrench className="h-3 w-3 text-brand" />
                    <span className="font-mono font-semibold text-ink">
                      {bay.code}
                    </span>
                    <span className="text-ink-secondary">
                      {BAY_TYPE_LABELS[bay.bayType] ?? bay.bayType}
                    </span>
                    <StatusPill
                      label={
                        bay.status === "MAINTENANCE"
                          ? "Bảo trì"
                          : bay.status === "OCCUPIED"
                            ? "Đang dùng"
                            : "Sẵn sàng"
                      }
                      tone={
                        bay.status === "MAINTENANCE"
                          ? "danger"
                          : bay.status === "OCCUPIED"
                            ? "warning"
                            : "success"
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="divide-y divide-line">
              {garage.slots.map((slot) => {
                const ratio =
                  slot.bayCount > 0 ? slot.activeCount / slot.bayCount : 0;
                const loadTone =
                  ratio >= 1 ? "danger" : ratio >= 0.75 ? "warning" : "success";

                return (
                  <div
                    key={slot.time}
                    className="grid grid-cols-1 gap-3 px-5 py-3.5 md:grid-cols-12 md:items-start"
                  >
                    <div className="flex items-center gap-3 md:col-span-3">
                      <span className="font-mono text-sm font-bold text-ink">
                        {slot.time}
                      </span>
                      <StatusPill
                        label={`${slot.activeCount}/${slot.bayCount} cầu`}
                        tone={loadTone}
                      />
                    </div>

                    <div className="md:col-span-9">
                      {slot.bookings.length === 0 ? (
                        <span className="text-xs text-ink-muted">
                          Trống — sẵn sàng tiếp nhận lịch mới
                        </span>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                          {slot.bookings.map((b) => {
                            const bayInfo = garage.bays.find(
                              (bay) => bay.id === b.bayId
                            );
                            return (
                              <Link
                                key={b.id}
                                href={`/bookings/${b.id}`}
                                className="block rounded-lg border border-line bg-surface-subtle/50 p-3 text-xs transition-colors hover:border-brand hover:bg-brand-soft/30"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono font-bold text-brand">
                                    {b.orderCode}
                                  </span>
                                  <BookingStatusBadge status={b.status} />
                                </div>
                                <div className="mt-1.5 font-semibold text-ink">
                                  {b.customerName}
                                </div>
                                <div className="text-[11px] text-ink-secondary">
                                  {b.vehicleLabel} •{" "}
                                  <span className="font-mono">
                                    {b.licensePlate}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[11px]">
                                  <span className="font-mono text-ink-muted">
                                    {bayInfo ? bayInfo.code : "Chưa gán cầu"}
                                  </span>
                                  <strong className="tabular-nums text-ink">
                                    {formatVnd(b.totalVnd)}
                                  </strong>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

      <CreateBookingModal
        open={createOpen}
        defaultDate={date}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

