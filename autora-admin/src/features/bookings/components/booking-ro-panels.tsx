"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  Camera,
  CheckCircle2,
  CreditCard,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import {
  fetchAdminGarageDetail,
  fetchAdminGarages,
} from "@/features/garages/api";
import { fetchAdminParts } from "@/features/inventory/api";
import { fetchAdminServices } from "@/features/services/api";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader } from "@/shared/ui/card";
import { GalleryUploadField } from "@/shared/ui/image-upload";
import { Input, Select, Textarea } from "@/shared/ui/input";
import { PaymentStatusBadge, StatusPill } from "@/shared/ui/status-badge";
import { useToast } from "@/shared/ui/toast-provider";
import { formatViDateTime, formatVnd } from "@/shared/utils/format";
import {
  addAdminBookingItem,
  type BookingDetail,
  issueBookingBomParts,
  issueBookingManualPart,
  type PaymentMethod,
  recordAdminBookingInspection,
  recordAdminBookingPayment,
  removeAdminBookingItem,
  rescheduleAdminBooking,
  returnBookingPart,
} from "../api";

const SLOTS = ["08:00", "09:30", "11:00", "13:30", "15:00", "16:30"] as const;

export function RescheduleBookingModal({
  open,
  booking,
  onClose,
}: {
  readonly open: boolean;
  readonly booking: BookingDetail;
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const [appointmentDate, setAppointmentDate] = useState(
    booking.appointmentDate
  );
  const [appointmentTime, setAppointmentTime] = useState(
    booking.appointmentTime
  );
  const [garageId, setGarageId] = useState(booking.garageId);
  const [bayId, setBayId] = useState(booking.bayId ?? "");
  const [odoKm, setOdoKm] = useState(String(booking.odoKm));
  const [reason, setReason] = useState("");

  const { data: garagesPage } = useQuery({
    queryKey: ["admin", "garages", "all-options"],
    queryFn: () => fetchAdminGarages({ page: 1, limit: 50, status: "ACTIVE" }),
    enabled: open,
  });

  const { data: selectedGarageDetail } = useQuery({
    queryKey: ["admin", "garage", garageId],
    queryFn: () => fetchAdminGarageDetail(garageId),
    enabled: open && Boolean(garageId),
  });

  const mutation = useMutation({
    mutationFn: () =>
      rescheduleAdminBooking(booking.id, {
        appointmentDate,
        appointmentTime,
        garageId,
        bayId: bayId || null,
        odoKm: Number.parseInt(odoKm, 10) || booking.odoKm,
        expectedVersion: booking.version,
        reason: reason.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "booking", booking.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      notifySuccess("Đã cập nhật điều phối lịch hẹn & cầu nâng.");
      onClose();
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError ? err.message : "Không thể dời lịch hẹn."
      );
    },
  });

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
    >
      <div className="w-full max-w-lg rounded-xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-sm font-bold text-ink">
            Điều phối lại / Gán cầu nâng ({booking.orderCode})
          </h3>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-md p-1 text-ink-muted hover:bg-surface-subtle cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4 p-5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                Ngày hẹn
              </label>
              <Input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                Khung giờ
              </label>
              <Select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              >
                {SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-ink">
                Garage thực hiện
              </label>
              <Select
                value={garageId}
                onChange={(e) => {
                  setGarageId(e.target.value);
                  setBayId("");
                }}
              >
                {(garagesPage?.items ?? []).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.district})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                Gán cầu nâng cụ thể
              </label>
              <Select value={bayId} onChange={(e) => setBayId(e.target.value)}>
                <option value="">Tự động sắp xếp</option>
                {(selectedGarageDetail?.bays ?? []).map((bay) => (
                  <option
                    key={bay.id}
                    value={bay.id}
                    disabled={bay.status === "MAINTENANCE"}
                  >
                    {bay.code} — {bay.name}
                    {bay.status === "MAINTENANCE" ? " (Đang bảo trì)" : ""}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                Số ODO (km)
              </label>
              <Input
                type="number"
                min={0}
                value={odoKm}
                onChange={(e) => setOdoKm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              Lý do điều phối
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Khách xin dời giờ sáng hoặc chuyển cầu cân chỉnh 3D"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              <RefreshCw className="h-3.5 w-3.5" />
              {mutation.isPending ? "Đang lưu..." : "Lưu điều phối"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PaymentReconciliationCard({
  booking,
}: {
  readonly booking: BookingDetail;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const [method, setMethod] = useState<PaymentMethod>(
    (booking.paymentMethod as PaymentMethod) || "PAY_AT_GARAGE"
  );
  const [referenceCode, setReferenceCode] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: (action: "CAPTURE" | "REFUND") =>
      recordAdminBookingPayment(booking.id, {
        action,
        method,
        referenceCode: referenceCode.trim() || undefined,
        reason: reason.trim() || undefined,
        expectedVersion: booking.version,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "booking", booking.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setReferenceCode("");
      setReason("");
      notifySuccess("Đã cập nhật đối soát thanh toán.");
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError
          ? err.message
          : "Không thể cập nhật trạng thái thanh toán."
      );
    },
  });

  return (
    <Card>
      <CardHeader
        title="Đối soát Thanh toán"
        description={`Tổng thu: ${formatVnd(booking.totalVnd)}`}
        action={<PaymentStatusBadge status={booking.paymentStatus} />}
      />
      <div className="space-y-4 p-5">
        {booking.paymentStatus !== "REFUNDED" && (
          <div className="space-y-3 rounded-lg border border-line bg-surface-subtle/50 p-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink">
                  Phương thức thực tế
                </label>
                <Select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                >
                  <option value="PAY_AT_GARAGE">Tiền mặt / POS tại xưởng</option>
                  <option value="VIETQR">Chuyển khoản VietQR</option>
                  <option value="VNPAY">VNPay / Thẻ</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink">
                  Mã giao dịch / Số hóa đơn
                </label>
                <Input
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder="VD: FT2632910082"
                />
              </div>
            </div>

            {booking.paymentStatus === "PAID" && (
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink">
                  Lý do hoàn tiền (bắt buộc khi hoàn)
                </label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do hoàn tiền..."
                />
              </div>
            )}

            <div className="flex justify-end">
              {booking.paymentStatus === "UNPAID" ? (
                <Button
                  size="sm"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate("CAPTURE")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {mutation.isPending
                    ? "Đang ghi nhận..."
                    : `Xác nhận đã thu ${formatVnd(booking.totalVnd)}`}
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate("REFUND")}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  {mutation.isPending ? "Đang xử lý..." : "Ghi nhận hoàn tiền"}
                </Button>
              )}
            </div>
          </div>
        )}

        {booking.paymentLogs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-ink-secondary">
              Lịch sử đối soát ({booking.paymentLogs.length})
            </h4>
            <div className="divide-y divide-line rounded-lg border border-line">
              {booking.paymentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
                >
                  <div>
                    <StatusPill
                      label={log.action === "CAPTURE" ? "Thu tiền" : "Hoàn tiền"}
                      tone={log.action === "CAPTURE" ? "success" : "danger"}
                    />
                    <span className="ml-2 font-medium text-ink">
                      {log.method}
                    </span>
                    {log.referenceCode && (
                      <span className="ml-2 font-mono text-[11px] text-ink-muted">
                        #{log.referenceCode}
                      </span>
                    )}
                    {log.reason && (
                      <p className="mt-1 text-[11px] text-ink-secondary">
                        {log.reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <strong className="block tabular-nums text-ink">
                      {formatVnd(log.amountVnd)}
                    </strong>
                    <span className="text-[10px] text-ink-muted">
                      {formatViDateTime(log.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export function WorkOrderItemsCard({
  booking,
}: {
  readonly booking: BookingDetail;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [adding, setAdding] = useState(false);
  const [serviceProductId, setServiceProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [markWaitingApproval, setMarkWaitingApproval] = useState(true);

  const isTerminal = ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(
    booking.status
  );

  const { data: servicesPage } = useQuery({
    queryKey: ["admin", "services", "active-options"],
    queryFn: () =>
      fetchAdminServices({ page: 1, limit: 50, isActive: "true" }),
    enabled: adding,
  });

  const services = servicesPage?.items ?? [];
  const effectiveServiceId = serviceProductId || services[0]?.id || "";

  const addMutation = useMutation({
    mutationFn: () =>
      addAdminBookingItem(booking.id, {
        serviceProductId: effectiveServiceId,
        quantity: Number.parseInt(quantity, 10) || 1,
        markWaitingApproval,
        expectedVersion: booking.version,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "booking", booking.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      setAdding(false);
      notifySuccess("Đã thêm hạng mục phát sinh vào Lệnh sửa chữa.");
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError ? err.message : "Không thể thêm hạng mục."
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) =>
      removeAdminBookingItem(booking.id, itemId, booking.version),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "booking", booking.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      notifySuccess("Đã gỡ hạng mục khỏi Lệnh sửa chữa.");
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError ? err.message : "Không thể gỡ hạng mục."
      );
    },
  });

  return (
    <Card>
      <CardHeader
        title="Hạng mục Dịch vụ & Phát sinh (Work Order)"
        description={
          booking.customerApprovalStatus === "PENDING"
            ? "Đang chờ khách hàng duyệt báo giá phát sinh"
            : undefined
        }
        action={
          !isTerminal && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAdding((prev) => !prev)}
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm phát sinh
            </Button>
          )
        }
      />

      {adding && !isTerminal && (
        <div className="border-b border-line bg-surface-subtle/60 p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-3">
              <Select
                value={effectiveServiceId}
                onChange={(e) => setServiceProductId(e.target.value)}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatVnd(s.priceVnd)})
                  </option>
                ))}
              </Select>
            </div>
            <Input
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-xs text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={markWaitingApproval}
                onChange={(e) => setMarkWaitingApproval(e.target.checked)}
                className="h-4 w-4 rounded border-line-strong text-brand"
              />
              Chuyển trạng thái sang &quot;Chờ duyệt phát sinh&quot;
            </label>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAdding(false)}
              >
                Đóng
              </Button>
              <Button
                size="sm"
                disabled={addMutation.isPending || !effectiveServiceId}
                onClick={() => addMutation.mutate()}
              >
                {addMutation.isPending ? "Đang thêm..." : "Thêm vào RO"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-line">
        {booking.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 px-5 py-3.5 text-xs sm:text-sm"
          >
            <div>
              <strong className="block font-semibold text-ink">
                {item.serviceNameSnap}
              </strong>
              <span className="text-[11px] font-mono text-ink-muted">
                SKU: {item.skuSnap} • SL: {item.quantity} ×{" "}
                {formatVnd(item.unitPriceVnd)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <strong className="font-semibold text-ink tabular-nums">
                {formatVnd(item.lineTotalVnd)}
              </strong>
              {!isTerminal && booking.items.length > 1 && (
                <button
                  type="button"
                  title="Gỡ hạng mục"
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate(item.id)}
                  className="rounded-md p-1 text-ink-muted hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-line bg-surface-subtle/50 px-5 py-3.5 space-y-1.5 text-xs sm:text-sm">
        <div className="flex justify-between text-ink-secondary">
          <span>Tạm tính</span>
          <span className="tabular-nums">{formatVnd(booking.subtotalVnd)}</span>
        </div>
        {booking.discountVnd > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Giảm giá</span>
            <span className="tabular-nums">
              -{formatVnd(booking.discountVnd)}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-2 font-bold text-ink">
          <span>Tổng thanh toán</span>
          <span className="text-brand tabular-nums">
            {formatVnd(booking.totalVnd)}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function VehicleInspectionPanel({
  booking,
}: {
  readonly booking: BookingDetail;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const [openForm, setOpenForm] = useState(false);
  const [phase, setPhase] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [odoKm, setOdoKm] = useState(String(booking.odoKm));
  const [fuelLevel, setFuelLevel] = useState<"E" | "1/4" | "1/2" | "3/4" | "F">(
    "1/2"
  );
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      recordAdminBookingInspection(booking.id, {
        phase,
        odoKm: Number.parseInt(odoKm, 10) || undefined,
        fuelLevel,
        photoUrls,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "booking", booking.id], updated);
      setOpenForm(false);
      setPhotoUrls([]);
      setNotes("");
      notifySuccess("Đã lưu biên bản kiểm tra hiện trạng xe (DVI).");
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError ? err.message : "Không thể lưu biên bản DVI."
      );
    },
  });

  return (
    <Card>
      <CardHeader
        title="Biên bản Kiểm tra Xe (DVI Check-in / Check-out)"
        description="Lưu ảnh hiện trạng xe trước và sau khi thực hiện dịch vụ qua Cloudinary."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setOpenForm((prev) => !prev)}
          >
            <Camera className="h-3.5 w-3.5" />
            {openForm ? "Đóng form" : "Lập biên bản DVI"}
          </Button>
        }
      />

      {openForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4 border-b border-line bg-surface-subtle/40 p-5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                Giai đoạn kiểm tra
              </label>
              <Select
                value={phase}
                onChange={(e) =>
                  setPhase(e.target.value as "CHECK_IN" | "CHECK_OUT")
                }
              >
                <option value="CHECK_IN">Nhận xe (Check-in)</option>
                <option value="CHECK_OUT">Bàn giao (Check-out)</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                Số ODO thực tế (km)
              </label>
              <Input
                type="number"
                min={0}
                value={odoKm}
                onChange={(e) => setOdoKm(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">
                Mức nhiên liệu
              </label>
              <Select
                value={fuelLevel}
                onChange={(e) =>
                  setFuelLevel(
                    e.target.value as "E" | "1/4" | "1/2" | "3/4" | "F"
                  )
                }
              >
                <option value="E">Cạn (E)</option>
                <option value="1/4">1/4 bình</option>
                <option value="1/2">1/2 bình</option>
                <option value="3/4">3/4 bình</option>
                <option value="F">Đầy (F)</option>
              </Select>
            </div>
          </div>

          <GalleryUploadField
            urls={photoUrls}
            onChange={setPhotoUrls}
            folder="general"
          />

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              Ghi chú hiện trạng / Vật tư bàn giao
            </label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Cản trước có vết xước nhẹ bên phải, áp suất lốp 2.3 bar..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOpenForm(false)}
            >
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang lưu..." : "Lưu biên bản DVI"}
            </Button>
          </div>
        </form>
      )}

      <div className="divide-y divide-line">
        {booking.inspections.length === 0 ? (
          <p className="p-5 text-xs text-ink-muted">
            Chưa có biên bản kiểm tra xe nào được ghi nhận cho đơn này.
          </p>
        ) : (
          booking.inspections.map((ins) => (
            <div key={ins.id} className="space-y-2 p-5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusPill
                    label={
                      ins.phase === "CHECK_IN"
                        ? "Nhận xe (Check-in)"
                        : "Bàn giao (Check-out)"
                    }
                    tone={ins.phase === "CHECK_IN" ? "brand" : "success"}
                  />
                  {ins.odoKm !== null && (
                    <span className="font-mono text-ink-secondary">
                      ODO: {new Intl.NumberFormat("vi-VN").format(ins.odoKm)} km
                    </span>
                  )}
                  {ins.fuelLevel && (
                    <span className="text-ink-secondary">
                      • Xăng: {ins.fuelLevel}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-ink-muted">
                  {ins.inspectedByEmail} • {formatViDateTime(ins.createdAt)}
                </span>
              </div>

              {ins.notes && <p className="text-ink-secondary">{ins.notes}</p>}

              {ins.photoUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {ins.photoUrls.map((url, idx) => (
                    <a
                      key={`${ins.id}-p-${idx}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-[4/3] overflow-hidden rounded-lg border border-line bg-surface-subtle"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Ảnh DVI ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function BookingPartsCard({
  booking,
}: {
  readonly booking: BookingDetail;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [manualOpen, setManualOpen] = useState(false);
  const [partItemId, setPartItemId] = useState("");
  const [qtyUsed, setQtyUsed] = useState("1");

  const { data: partsData } = useQuery({
    queryKey: ["admin", "parts", "booking-issue"],
    queryFn: () => fetchAdminParts({ page: 1, limit: 100 }),
    enabled: manualOpen,
  });

  const parts = partsData?.items ?? [];
  const effectivePartId = partItemId || parts[0]?.id || "";

  const issueBomMutation = useMutation({
    mutationFn: () => issueBookingBomParts(booking.id),
    onSuccess: () => {
      notifySuccess("Đã xuất vật tư theo BOM & trừ kho Garage");
      void queryClient.invalidateQueries({
        queryKey: ["admin", "booking", booking.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError
          ? err.message
          : "Xuất BOM thất bại. Vui lòng kiểm tra tồn kho hoặc BOM."
      );
    },
  });

  const issueManualMutation = useMutation({
    mutationFn: () =>
      issueBookingManualPart(booking.id, {
        partItemId: effectivePartId,
        qtyUsed: Number(qtyUsed),
      }),
    onSuccess: () => {
      notifySuccess("Đã xuất lẻ vật tư & ghi nhận giá vốn (COGS)");
      setManualOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ["admin", "booking", booking.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError
          ? err.message
          : "Xuất lẻ thất bại. Không đủ tồn kho hoặc lỗi dữ liệu."
      );
    },
  });

  const returnMutation = useMutation({
    mutationFn: (usageId: string) => returnBookingPart(booking.id, usageId),
    onSuccess: () => {
      notifySuccess("Đã hoàn trả vật tư về kho Garage");
      void queryClient.invalidateQueries({
        queryKey: ["admin", "booking", booking.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
    onError: (err) => {
      notifyError(
        err instanceof ApiError ? err.message : "Hoàn kho thất bại. Vui lòng thử lại."
      );
    },
  });

  const grossProfitVnd = booking.totalVnd - booking.cogsTotalVnd;

  return (
    <Card>
      <CardHeader
        title="Vật tư xuất kho & Giá vốn (COGS)"
        description="Xuất vật tư tự động theo định mức BOM hoặc xuất lẻ, tính giá vốn thực tế của RO"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={issueBomMutation.isPending}
              onClick={() => issueBomMutation.mutate()}
            >
              <Boxes className="h-3.5 w-3.5" />
              {issueBomMutation.isPending ? "Đang xuất..." : "Xuất theo BOM"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setManualOpen((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5" />
              Xuất lẻ
            </Button>
          </div>
        }
      />

      {manualOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!effectivePartId) return;
            issueManualMutation.mutate();
          }}
          className="grid grid-cols-12 items-end gap-2 border-b border-line bg-surface-subtle p-4 text-xs"
        >
          <div className="col-span-7">
            <label className="mb-1 block font-semibold text-ink">Chọn vật tư / phụ tùng</label>
            <Select
              value={effectivePartId}
              onChange={(e) => setPartItemId(e.target.value)}
            >
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name} ({p.unit})
                </option>
              ))}
            </Select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block font-semibold text-ink">Số lượng</label>
            <Input
              type="number"
              min={0.5}
              step="0.5"
              required
              value={qtyUsed}
              onChange={(e) => setQtyUsed(e.target.value)}
            />
          </div>
          <div className="col-span-3 flex justify-end gap-1.5">
            <Button
              type="submit"
              size="sm"
              disabled={issueManualMutation.isPending || !effectivePartId}
            >
              Xuất kho
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setManualOpen(false)}
            >
              Đóng
            </Button>
          </div>
        </form>
      )}

      <div className="divide-y divide-line">
        {booking.partUsages.length === 0 ? (
          <p className="p-5 text-xs text-ink-muted">
            Chưa xuất vật tư nào cho Lệnh sửa chữa này. Bấm{" "}
            <strong>Xuất theo BOM</strong> để trừ kho tự động theo dịch vụ đã chọn.
          </p>
        ) : (
          booking.partUsages.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand">{u.sku}</span>
                  <span className="font-semibold text-ink">{u.partName}</span>
                </div>
                <div className="text-[11px] text-ink-muted">
                  SL: {u.qtyUsed} {u.unit} × {formatVnd(u.unitCostVnd)} • Xuất bởi{" "}
                  {u.issuedByEmail ?? "—"}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono font-bold tabular-nums text-ink">
                  {formatVnd(u.lineCostVnd)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={returnMutation.isPending}
                  onClick={() => returnMutation.mutate(u.id)}
                  title="Hoàn trả vật tư về kho Garage"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-ink-secondary" />
                  Hoàn kho
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-surface-subtle px-5 py-3 text-xs">
        <span>
          Tổng giá vốn vật tư (COGS):{" "}
          <strong className="font-mono text-sm text-ink">
            {formatVnd(booking.cogsTotalVnd)}
          </strong>
        </span>
        <span>
          Lợi nhuận gộp tạm tính:{" "}
          <strong
            className={`font-mono text-sm ${
              grossProfitVnd >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatVnd(grossProfitVnd)}
          </strong>
        </span>
      </div>
    </Card>
  );
}

