"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { ErrorState, TableSkeleton } from "@/shared/ui/feedback";
import { BookingStatusBadge, PaymentStatusBadge } from "@/shared/ui/status-badge";
import { useToast } from "@/shared/ui/toast-provider";
import {
  formatViDate,
  formatViDateTime,
  formatVnd,
} from "@/shared/utils/format";
import {
  type BookingStatus,
  fetchAdminBookingDetail,
  updateAdminBookingStatus,
} from "../api";

const TRANSITION_LABELS: Record<
  BookingStatus,
  { label: string; variant: "primary" | "danger"; description: string }
> = {
  PENDING_CONFIRMATION: {
    label: "Chờ xác nhận",
    variant: "primary",
    description: "",
  },
  CONFIRMED: {
    label: "Xác nhận lịch hẹn",
    variant: "primary",
    description:
      "Xác nhận garage đã tiếp nhận lịch hẹn và bố trí cầu nâng phù hợp.",
  },
  IN_PROGRESS: {
    label: "Bắt đầu thực hiện",
    variant: "primary",
    description:
      "Đánh dấu xe đã vào xưởng và kỹ thuật viên đang tiến hành dịch vụ.",
  },
  COMPLETED: {
    label: "Đánh dấu hoàn tất",
    variant: "primary",
    description:
      "Xác nhận đã nghiệm thu và hoàn tất toàn bộ hạng mục dịch vụ (trạng thái cuối, không thể hoàn tác).",
  },
  CANCELLED: {
    label: "Hủy lịch hẹn",
    variant: "danger",
    description:
      "Hủy lịch hẹn này trên hệ thống (trạng thái cuối, không thể mở lại). Vui lòng nhập lý do hủy rõ ràng.",
  },
};

export function BookingDetailView({ bookingId }: { readonly bookingId: string }) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [pendingTargetStatus, setPendingTargetStatus] =
    useState<BookingStatus | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "booking", bookingId],
    queryFn: () => fetchAdminBookingDetail(bookingId),
  });

  const statusMutation = useMutation({
    mutationFn: (payload: {
      status: BookingStatus;
      expectedVersion: number;
      reason?: string;
    }) => updateAdminBookingStatus(bookingId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "booking", bookingId], updated);
      void queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setPendingTargetStatus(null);
      notifySuccess(`Đã cập nhật trạng thái đơn ${updated.orderCode}.`);
    },
    onError: (err) => {
      setPendingTargetStatus(null);
      if (err instanceof ApiError) {
        notifyError(err.message);
        if (err.status === 409) {
          void refetch();
        }
      } else {
        notifyError("Không thể cập nhật trạng thái lịch hẹn.");
      }
    },
  });

  if (isLoading) {
    return (
      <Card>
        <TableSkeleton rows={6} cols={3} />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        message={
          error instanceof ApiError
            ? error.message
            : "Không thể tải chi tiết lịch hẹn."
        }
        status={error instanceof ApiError ? error.status : undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách lịch hẹn
        </Link>
        <span className="font-mono text-xs text-ink-muted">
          Phiên bản đồng bộ: v{data.version}
        </span>
      </div>

      {/* Header Card */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-mono text-lg sm:text-xl font-bold text-ink">
                {data.orderCode}
              </h2>
              <BookingStatusBadge status={data.status} />
              <PaymentStatusBadge status={data.paymentStatus} />
            </div>
            <p className="mt-1 text-xs text-ink-secondary">
              Lịch hẹn ngày{" "}
              <strong className="text-ink">
                {formatViDate(data.appointmentDate)} lúc {data.appointmentTime}
              </strong>{" "}
              • Tạo lúc {formatViDateTime(data.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {data.allowedNextStatuses.length === 0 ? (
              <span className="rounded-lg border border-line bg-surface-subtle px-3 py-1.5 text-xs font-medium text-ink-secondary">
                Đơn đã ở trạng thái kết thúc
              </span>
            ) : (
              data.allowedNextStatuses.map((nextStatus) => {
                const cfg = TRANSITION_LABELS[nextStatus];
                return (
                  <Button
                    key={nextStatus}
                    variant={cfg.variant}
                    size="md"
                    disabled={statusMutation.isPending}
                    onClick={() => setPendingTargetStatus(nextStatus)}
                  >
                    {cfg.label}
                  </Button>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Services Breakdown */}
          <Card>
            <CardHeader title="Hạng mục dịch vụ đã đặt" />
            <div className="divide-y divide-line">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 px-5 py-3.5 text-xs sm:text-sm"
                >
                  <div>
                    <strong className="block font-semibold text-ink">
                      {item.serviceNameSnap}
                    </strong>
                    <span className="font-mono text-[11px] text-ink-muted">
                      SKU: {item.skuSnap} • SL: {item.quantity} ×{" "}
                      {formatVnd(item.unitPriceVnd)}
                    </span>
                  </div>
                  <strong className="shrink-0 font-semibold text-ink tabular-nums">
                    {formatVnd(item.lineTotalVnd)}
                  </strong>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 border-t border-line bg-surface-subtle/50 px-5 py-4 text-xs sm:text-sm">
              <div className="flex justify-between text-ink-secondary">
                <span>Tạm tính</span>
                <span className="tabular-nums">{formatVnd(data.subtotalVnd)}</span>
              </div>
              {data.discountVnd > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Giảm giá</span>
                  <span className="tabular-nums">-{formatVnd(data.discountVnd)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-2 font-bold text-ink">
                <span>Tổng thanh toán</span>
                <span className="text-base text-brand tabular-nums">
                  {formatVnd(data.totalVnd)}
                </span>
              </div>
            </div>
          </Card>

          {/* Status History Timeline */}
          <Card>
            <CardHeader
              title="Lịch sử thay đổi trạng thái"
              description="Theo dõi đầy đủ người thực hiện và lý do chuyển trạng thái"
            />
            <div className="divide-y divide-line">
              {data.statusHistory.length === 0 ? (
                <p className="p-5 text-xs text-ink-muted">
                  Chưa ghi nhận lịch sử chuyển trạng thái.
                </p>
              ) : (
                data.statusHistory.map((h) => (
                  <div
                    key={h.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                        {h.fromStatus ? (
                          <>
                            <BookingStatusBadge status={h.fromStatus} />
                            <span className="text-ink-muted">→</span>
                          </>
                        ) : (
                          <span className="text-ink-muted">Khởi tạo:</span>
                        )}
                        <BookingStatusBadge status={h.toStatus} />
                      </div>
                      {h.reason && (
                        <p className="pl-5 text-ink-secondary">
                          Lý do: {h.reason}
                        </p>
                      )}
                      {h.changedByEmail && (
                        <p className="pl-5 text-[11px] text-ink-muted">
                          Thực hiện bởi: {h.changedByEmail}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-muted">
                      <Clock className="h-3 w-3" />
                      {formatViDateTime(h.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Customer, Vehicle, Garage */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="p-5 space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-secondary">
              <User className="h-4 w-4 text-brand" />
              Thông tin khách hàng
            </h3>
            <div className="space-y-1 text-xs sm:text-sm">
              <strong className="block text-ink">{data.customerName}</strong>
              <span className="block text-ink-secondary">
                SĐT: {data.customerPhone}
              </span>
              {data.userEmail && (
                <span className="block text-ink-secondary">
                  Email: {data.userEmail}
                </span>
              )}
              {data.userId && (
                <Link
                  href={`/customers/${data.userId}`}
                  className="mt-2 inline-block text-xs font-semibold text-brand hover:underline"
                >
                  Xem hồ sơ khách hàng →
                </Link>
              )}
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-secondary">
              <Car className="h-4 w-4 text-brand" />
              Phương tiện & Ghi chú
            </h3>
            <div className="space-y-1.5 text-xs sm:text-sm">
              <strong className="block text-ink">{data.vehicleLabel}</strong>
              <span className="block font-mono text-xs text-ink-secondary">
                Biển số: {data.licensePlate}
              </span>
              <span className="block text-xs text-ink-secondary tabular-nums">
                Số ODO: {new Intl.NumberFormat("vi-VN").format(data.odoKm)} km
              </span>
              {data.notes && (
                <div className="mt-2 rounded-lg border border-line bg-surface-subtle p-3 text-xs text-ink-secondary">
                  <strong className="block text-ink">Ghi chú kỹ thuật:</strong>
                  {data.notes}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-secondary">
              <Building2 className="h-4 w-4 text-brand" />
              Garage tiếp nhận
            </h3>
            <div className="space-y-1 text-xs sm:text-sm">
              <strong className="block text-ink">{data.garageName}</strong>
              <span className="block text-xs text-ink-secondary">
                {data.garageAddress}
              </span>
              <span className="mt-2 inline-flex items-center gap-1 text-xs text-ink-secondary">
                <CalendarClock className="h-3.5 w-3.5 text-brand" />
                Hình thức: {data.paymentMethod}
              </span>
              <div>
                <Link
                  href={`/garages/${data.garageId}`}
                  className="mt-2 inline-block text-xs font-semibold text-brand hover:underline"
                >
                  Xem chi tiết garage →
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog for Status Transition */}
      {pendingTargetStatus && (
        <ConfirmDialog
          open={true}
          title={TRANSITION_LABELS[pendingTargetStatus].label}
          description={TRANSITION_LABELS[pendingTargetStatus].description}
          confirmLabel={TRANSITION_LABELS[pendingTargetStatus].label}
          tone={
            pendingTargetStatus === "CANCELLED" ? "danger" : "primary"
          }
          requireReason={pendingTargetStatus === "CANCELLED"}
          reasonLabel="Lý do hủy lịch hẹn *"
          reasonPlaceholder="VD: Khách hàng yêu cầu dời lịch sang tuần sau..."
          isPending={statusMutation.isPending}
          onClose={() => setPendingTargetStatus(null)}
          onConfirm={(reason) =>
            statusMutation.mutate({
              status: pendingTargetStatus,
              expectedVersion: data.version,
              reason,
            })
          }
        />
      )}
    </div>
  );
}

