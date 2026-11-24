"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  MapPin,
  Calendar,
  Clock,
  Car,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/core/formatters/currency";
import { formatVietnameseDate } from "@/core/formatters/datetime";
import { garageService } from "@/features/garages/services/garage.service";
import { catalogService } from "@/features/catalog/services/catalog.service";
import {
  useStore,
  type ServiceOrder,
} from "@/features/cart/context/store-context";

const TIME_SLOTS = [
  "08:00",
  "09:30",
  "11:00",
  "13:30",
  "15:00",
  "16:30",
] as const;

const PAYMENT_METHODS = [
  {
    id: "pay-at-garage",
    label: "Thanh toán tại garage sau khi nghiệm thu xe",
    desc: "Khuyên dùng — Kiểm tra xe hoàn tất mới thanh toán bằng tiền mặt, thẻ hoặc chuyển khoản.",
  },
  {
    id: "vietqr",
    label: "Chuyển khoản nhanh VietQR 24/7",
    desc: "Quét mã QR ngân hàng tại quầy dịch vụ không mất phí giao dịch.",
  },
  {
    id: "vnpay",
    label: "Cổng thanh toán VNPAY / Thẻ nội địa & Quốc tế",
    desc: "Hỗ trợ xuất hóa đơn VAT điện tử cho xe công ty / doanh nghiệp.",
  },
] as const;

export default function CheckoutPage() {
  const {
    cart,
    subtotalVnd,
    discountVnd,
    totalVnd,
    activeVehicle,
    bookingDraft,
    addToCart,
    placeOrder,
  } = useStore();

  const garages = garageService.getAllGarages();

  const [selectedGarageId, setSelectedGarageId] = useState(
    bookingDraft?.garageId ?? cart[0]?.selectedGarageId ?? garages[0].id
  );
  const [dateIso, setDateIso] = useState(
    bookingDraft?.preferredDate ?? "2026-11-24"
  );
  const [timeSlot, setTimeSlot] = useState(
    bookingDraft?.preferredTime ?? "09:30"
  );
  const [customerName, setCustomerName] = useState("Nguyễn Minh Khoa");
  const [customerPhone, setCustomerPhone] = useState("0909 688 912");
  const [vehicleLabel, setVehicleLabel] = useState(
    `${activeVehicle.brand} ${activeVehicle.model} (${activeVehicle.year})`
  );
  const [licensePlate, setLicensePlate] = useState(activeVehicle.licensePlate);
  const [odoKm, setOdoKm] = useState(activeVehicle.currentOdoKm);
  const [paymentId, setPaymentId] = useState<string>(PAYMENT_METHODS[0].id);
  const [notes, setNotes] = useState(bookingDraft?.notes ?? "");
  const [completedOrder, setCompletedOrder] = useState<ServiceOrder | null>(
    null
  );

  const selectedGarage =
    garages.find((g) => g.id === selectedGarageId) ?? garages[0];

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const methodObj =
      PAYMENT_METHODS.find((m) => m.id === paymentId) ?? PAYMENT_METHODS[0];

    const created = placeOrder({
      appointmentDate: formatVietnameseDate(dateIso),
      appointmentTime: timeSlot,
      garageId: selectedGarage.id,
      garageName: selectedGarage.name,
      garageAddress: selectedGarage.fullAddress,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      vehicleLabel: vehicleLabel.trim(),
      licensePlate: licensePlate.trim().toUpperCase(),
      odoKm: odoKm.trim(),
      paymentMethodLabel: methodObj.label,
      notes: notes.trim() || undefined,
    });

    setCompletedOrder(created);
  };

  if (completedOrder) {
    return (
      <div className="bg-canvas pb-20">
        <Breadcrumbs
          items={[
            { label: "Đặt lịch & Thanh toán", href: ROUTES.CHECKOUT },
            { label: `Hoàn tất #${completedOrder.orderCode}` },
          ]}
        />

        <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
          <div className="rounded-xl border border-brand/30 bg-surface p-7 sm:p-10 shadow-md space-y-6">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand text-ink-inverse">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <div>
                <Badge variant="default">
                  Mã đơn dịch vụ: {completedOrder.orderCode}
                </Badge>
                <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold uppercase text-ink">
                  ĐẶT LỊCH DỊCH VỤ THÀNH CÔNG!
                </h1>
              </div>
            </div>

            <div className="divide-y divide-line rounded-lg border border-line bg-surface-subtle/50 p-5 text-sm">
              <div className="flex justify-between py-2.5">
                <span className="text-ink-secondary">Garage thực hiện</span>
                <strong className="text-right text-ink">
                  {completedOrder.garageName}
                </strong>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-ink-secondary">Địa chỉ</span>
                <span className="text-right text-ink">
                  {completedOrder.garageAddress}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-ink-secondary">Lịch hẹn tiếp nhận</span>
                <strong className="font-mono text-brand">
                  {completedOrder.appointmentTime} • {completedOrder.appointmentDate}
                </strong>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-ink-secondary">Phương tiện</span>
                <span className="text-ink">
                  {completedOrder.vehicleLabel} • {completedOrder.licensePlate}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-ink-secondary">Hình thức thanh toán</span>
                <span className="text-right text-ink">
                  {completedOrder.paymentMethodLabel}
                </span>
              </div>
              <div className="flex justify-between pt-3">
                <strong className="text-ink">Tổng chi phí dự kiến</strong>
                <strong className="font-display text-2xl font-extrabold text-brand">
                  {formatVND(completedOrder.totalVnd)}
                </strong>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" asChild>
                <Link href={ROUTES.SERVICES}>TIẾP TỤC XEM DỊCH VỤ</Link>
              </Button>
              <Button variant="primary" asChild>
                <Link href={ROUTES.ACCOUNT}>
                  THEO DÕI ĐƠN TRONG TÀI KHOẢN
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas pb-16">
      <Breadcrumbs
        items={[
          { label: "Giỏ dịch vụ", href: ROUTES.CART },
          { label: "Đặt lịch & Xác nhận đơn" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-extrabold uppercase text-ink border-b border-line pb-4">
          XÁC NHẬN ĐẶT LỊCH & THÔNG TIN XE
        </h1>

        {bookingDraft && (
          <div className="mt-5 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-xs sm:text-sm font-medium text-ink">
            <strong>Bản nháp từ Cố vấn AI:</strong> Thông tin garage, dịch vụ và khung giờ hẹn đã được điền sẵn. Vui lòng kiểm tra kỹ trước khi bấm xác nhận.
          </div>
        )}

        {cart.length === 0 ? (
          <div className="mt-8 rounded-xl border border-line bg-surface p-10 text-center shadow-xs space-y-4">
            <p className="font-display text-2xl font-bold uppercase text-ink">
              Bạn chưa chọn gói dịch vụ nào
            </p>
            <p className="text-xs text-ink-secondary">
              Bạn có thể thêm nhanh gói Kiểm tra tổng quát 32 điểm (300.000đ) để đặt lịch hẹn ngay hoặc quay lại cửa hàng.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                variant="accent"
                onClick={() => {
                  const checkPrd = catalogService.getProductBySlug(
                    "kiem-tra-tong-quat-chan-doan-obd-32-diem"
                  );
                  if (checkPrd) addToCart(checkPrd, 1, undefined, false);
                }}
              >
                + THÊM GÓI KIỂM TRA TỔNG QUÁT (300.000đ)
              </Button>
              <Button variant="secondary" asChild>
                <Link href={ROUTES.SERVICES}>CHỌN TỪ CỬA HÀNG</Link>
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handlePlaceOrder}
            className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12"
          >
            {/* Left 7 Columns: Checkout Steps */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Garage & Schedule */}
              <section className="rounded-xl border border-line bg-surface p-6 shadow-xs space-y-4">
                <h2 className="font-display text-xl font-bold uppercase text-ink flex items-center gap-2">
                  <span className="rounded-sm bg-brand px-2 py-0.5 font-mono text-xs text-ink-inverse">
                    01
                  </span>
                  Chọn chi nhánh Garage & Thời gian hẹn
                </h2>

                <div className="space-y-1.5">
                  <label
                    htmlFor="co-garage"
                    className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary"
                  >
                    <MapPin className="h-3.5 w-3.5 text-brand" />
                    Garage tiếp nhận
                  </label>
                  <select
                    id="co-garage"
                    data-agent-target="checkout.select.garage"
                    value={selectedGarageId}
                    onChange={(e) => setSelectedGarageId(e.target.value)}
                    className="h-11 w-full rounded-md border border-line-strong bg-surface px-4 text-sm text-ink focus:border-brand focus:outline-none"
                  >
                    {garages.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} — {g.fullAddress}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="co-date"
                      className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary"
                    >
                      <Calendar className="h-3.5 w-3.5 text-brand" />
                      Ngày hẹn ({formatVietnameseDate(dateIso)})
                    </label>
                    <Input
                      id="co-date"
                      data-agent-target="checkout.input.date"
                      type="date"
                      value={dateIso}
                      onChange={(e) => setDateIso(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                      <Clock className="h-3.5 w-3.5 text-brand" />
                      Khung giờ đưa xe đến
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          data-agent-target={`checkout.slot.${slot}`}
                          onClick={() => setTimeSlot(slot)}
                          className={
                            timeSlot === slot
                              ? "h-10 rounded-md bg-brand font-mono text-xs font-bold text-ink-inverse cursor-pointer"
                              : "h-10 rounded-md border border-line-strong bg-surface font-mono text-xs text-ink hover:border-brand cursor-pointer"
                          }
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Step 2: Customer & Vehicle Details */}
              <section className="rounded-xl border border-line bg-surface p-6 shadow-xs space-y-4">
                <h2 className="font-display text-xl font-bold uppercase text-ink flex items-center gap-2">
                  <span className="rounded-sm bg-brand px-2 py-0.5 font-mono text-xs text-ink-inverse">
                    02
                  </span>
                  Thông tin chủ xe & Phương tiện
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="co-name"
                      className="block text-xs text-ink-secondary"
                    >
                      Họ và tên *
                    </label>
                    <Input
                      id="co-name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="co-phone"
                      className="block text-xs text-ink-secondary"
                    >
                      Số điện thoại nhận SMS/Zalo *
                    </label>
                    <Input
                      id="co-phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="co-vehicle"
                      className="flex items-center gap-1 text-xs text-ink-secondary"
                    >
                      <Car className="h-3.5 w-3.5 text-brand" />
                      Hãng xe & Dòng xe *
                    </label>
                    <Input
                      id="co-vehicle"
                      value={vehicleLabel}
                      onChange={(e) => setVehicleLabel(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="co-plate"
                        className="block text-xs text-ink-secondary"
                      >
                        Biển số xe *
                      </label>
                      <Input
                        id="co-plate"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="co-odo"
                        className="block text-xs text-ink-secondary"
                      >
                        Số ODO (km)
                      </label>
                      <Input
                        id="co-odo"
                        value={odoKm}
                        onChange={(e) => setOdoKm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="co-notes"
                    className="block text-xs text-ink-secondary"
                  >
                    Ghi chú triệu chứng kỹ thuật cho cố vấn dịch vụ
                  </label>
                  <Input
                    id="co-notes"
                    data-agent-target="checkout.input.notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="VD: Kiểm tra thêm tiếng kêu gầm trước khi qua gờ giảm tốc..."
                  />
                </div>
              </section>

              {/* Step 3: Payment Method */}
              <section className="rounded-xl border border-line bg-surface p-6 shadow-xs space-y-4">
                <h2 className="font-display text-xl font-bold uppercase text-ink flex items-center gap-2">
                  <span className="rounded-sm bg-brand px-2 py-0.5 font-mono text-xs text-ink-inverse">
                    03
                  </span>
                  <CreditCard className="h-4 w-4 text-brand" />
                  Phương thức thanh toán
                </h2>

                <div className="space-y-2.5">
                  {PAYMENT_METHODS.map((pm) => (
                    <label
                      key={pm.id}
                      className={
                        paymentId === pm.id
                          ? "flex items-start gap-3 rounded-lg border-2 border-brand bg-brand-soft/40 p-4 cursor-pointer"
                          : "flex items-start gap-3 rounded-lg border border-line bg-surface p-4 cursor-pointer hover:border-line-strong"
                      }
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        checked={paymentId === pm.id}
                        onChange={() => setPaymentId(pm.id)}
                        className="mt-1 accent-brand"
                      />
                      <div>
                        <strong className="block text-sm text-ink">
                          {pm.label}
                        </strong>
                        <span className="text-xs text-ink-secondary">
                          {pm.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            {/* Right 5 Columns: Order Review */}
            <aside className="lg:col-span-5">
              <div className="rounded-xl border border-line bg-surface p-6 shadow-xs space-y-5 sticky top-28">
                <h2 className="font-display text-2xl font-extrabold uppercase text-ink border-b border-line pb-3">
                  ĐƠN DỊCH VỤ CỦA BẠN
                </h2>

                <div className="divide-y divide-line">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-start justify-between gap-3 py-3 text-xs sm:text-sm"
                    >
                      <div>
                        <strong className="text-ink block">{item.name}</strong>
                        <span className="text-xs text-ink-secondary">
                          Số lượng: {item.quantity} • {item.sku}
                        </span>
                      </div>
                      <strong className="shrink-0 font-mono text-ink">
                        {formatVND(item.priceVnd * item.quantity)}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t border-line pt-4 text-sm">
                  <div className="flex justify-between text-ink-secondary">
                    <span>Tạm tính:</span>
                    <span className="text-ink font-medium">
                      {formatVND(subtotalVnd)}
                    </span>
                  </div>
                  {discountVnd > 0 && (
                    <div className="flex justify-between text-accent font-medium">
                      <span>Ưu đãi giảm giá:</span>
                      <span>-{formatVND(discountVnd)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-line pt-3">
                    <strong className="text-ink">Tổng tham khảo:</strong>
                    <strong className="font-display text-3xl font-extrabold text-brand">
                      {formatVND(totalVnd)}
                    </strong>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  size="xl"
                  className="w-full"
                  data-agent-target="checkout.submit_booking"
                >
                  XÁC NHẬN ĐẶT LỊCH DỊCH VỤ
                </Button>
              </div>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}
