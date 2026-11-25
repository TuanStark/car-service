"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, X } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { fetchAdminGarages } from "@/features/garages/api";
import { fetchAdminServices } from "@/features/services/api";
import { Button } from "@/shared/ui/button";
import { Input, Select, Textarea } from "@/shared/ui/input";
import { useToast } from "@/shared/ui/toast-provider";
import { formatVnd } from "@/shared/utils/format";
import { createAdminBooking, type PaymentMethod } from "../api";

const SLOTS = ["08:00", "09:30", "11:00", "13:30", "15:00", "16:30"] as const;

function getTomorrowIsoDate(): string {
  return new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
}

export function CreateBookingModal({
  open,
  defaultDate,
  onClose,
}: {
  readonly open: boolean;
  readonly defaultDate?: string;
  readonly onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const { data: garagesPage } = useQuery({
    queryKey: ["admin", "garages", "all-options"],
    queryFn: () => fetchAdminGarages({ page: 1, limit: 50, status: "ACTIVE" }),
    enabled: open,
  });

  const { data: servicesPage } = useQuery({
    queryKey: ["admin", "services", "active-options"],
    queryFn: () =>
      fetchAdminServices({ page: 1, limit: 50, isActive: "true" }),
    enabled: open,
  });

  const garages = garagesPage?.items ?? [];
  const services = servicesPage?.items ?? [];

  const [garageId, setGarageId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(
    () => defaultDate ?? getTomorrowIsoDate()
  );
  const [appointmentTime, setAppointmentTime] = useState<string>("09:30");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [odoKm, setOdoKm] = useState("20000");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("PAY_AT_GARAGE");
  const [initialStatus, setInitialStatus] = useState<
    "CONFIRMED" | "CHECKED_IN" | "PENDING_CONFIRMATION"
  >("CONFIRMED");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveGarageId = garageId || garages[0]?.id || "";

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const estimatedTotal = services
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + s.priceVnd, 0);

  const mutation = useMutation({
    mutationFn: () =>
      createAdminBooking({
        garageId: effectiveGarageId,
        appointmentDate,
        appointmentTime,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        vehicleLabel: vehicleLabel.trim(),
        licensePlate: licensePlate.trim().toUpperCase(),
        odoKm: Number.parseInt(odoKm, 10) || 0,
        paymentMethod,
        initialStatus,
        notes: notes.trim() || undefined,
        items: selectedServiceIds.map((serviceProductId) => ({
          serviceProductId,
          quantity: 1,
        })),
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      notifySuccess(`Đã tạo lịch hẹn ${created.orderCode}.`);
      setCustomerName("");
      setCustomerPhone("");
      setVehicleLabel("");
      setLicensePlate("");
      setSelectedServiceIds([]);
      setNotes("");
      setFormError(null);
      onClose();
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Không thể tạo lịch hẹn mới.";
      setFormError(msg);
      notifyError(msg);
    },
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!effectiveGarageId) {
      setFormError("Vui lòng chọn garage tiếp nhận.");
      return;
    }
    if (selectedServiceIds.length === 0) {
      setFormError("Vui lòng chọn ít nhất 1 gói dịch vụ.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-booking-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-surface shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
          <div>
            <h3
              id="create-booking-title"
              className="text-sm sm:text-base font-bold text-ink"
            >
              Đặt lịch Hotline / Khách vãng lai
            </h3>
            <p className="text-xs text-ink-secondary">
              Hệ thống tự động kiểm tra sức chứa cầu nâng theo khung giờ.
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-md p-1 text-ink-muted hover:bg-surface-subtle hover:text-ink cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {formError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Garage tiếp nhận *
              </label>
              <Select
                value={effectiveGarageId}
                onChange={(e) => setGarageId(e.target.value)}
                required
              >
                {garages.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.district})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Ngày hẹn *
              </label>
              <Input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Khung giờ *
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

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Họ tên khách hàng *
              </label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="VD: Nguyễn Văn An"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Số điện thoại *
              </label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0901234567"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Dòng xe & Đời xe *
              </label>
              <Input
                value={vehicleLabel}
                onChange={(e) => setVehicleLabel(e.target.value)}
                placeholder="VD: Mazda CX-5 2.0 Premium (2023)"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  Biển số *
                </label>
                <Input
                  value={licensePlate}
                  onChange={(e) =>
                    setLicensePlate(e.target.value.toUpperCase())
                  }
                  placeholder="51K-123.45"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  ODO (km) *
                </label>
                <Input
                  type="number"
                  min={0}
                  value={odoKm}
                  onChange={(e) => setOdoKm(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Trạng thái khởi tạo
              </label>
              <Select
                value={initialStatus}
                onChange={(e) =>
                  setInitialStatus(
                    e.target.value as
                      | "CONFIRMED"
                      | "CHECKED_IN"
                      | "PENDING_CONFIRMATION"
                  )
                }
              >
                <option value="CONFIRMED">Đã xác nhận (Đặt trước)</option>
                <option value="CHECKED_IN">Đã tiếp nhận xe tại xưởng</option>
                <option value="PENDING_CONFIRMATION">Chờ xác nhận</option>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                Hình thức thanh toán
              </label>
              <Select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
              >
                <option value="PAY_AT_GARAGE">Thanh toán tại xưởng</option>
                <option value="VIETQR">Chuyển khoản VietQR</option>
                <option value="VNPAY">Thẻ / VNPay</option>
              </Select>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-ink">
                Chọn gói dịch vụ * ({selectedServiceIds.length} đã chọn)
              </label>
              <span className="text-xs font-bold text-brand tabular-nums">
                Tạm tính: {formatVnd(estimatedTotal)}
              </span>
            </div>
            <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-lg border border-line p-2.5">
              {services.map((srv) => {
                const checked = selectedServiceIds.includes(srv.id);
                return (
                  <label
                    key={srv.id}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer ${
                      checked
                        ? "border-brand bg-brand-soft/40"
                        : "border-transparent hover:bg-surface-subtle"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(srv.id)}
                        className="h-4 w-4 rounded border-line-strong text-brand"
                      />
                      <span className="font-medium text-ink">{srv.name}</span>
                    </span>
                    <strong className="shrink-0 tabular-nums text-ink">
                      {formatVnd(srv.priceVnd)}
                    </strong>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
              Ghi chú tiếp nhận / Triệu chứng xe
            </label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Khách báo phanh kêu nhẹ khi rà phanh tốc độ thấp..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang tạo..." : "Tạo lịch hẹn"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

