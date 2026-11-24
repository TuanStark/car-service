"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Car,
  ClipboardList,
  CheckCircle2,
  MapPin,
  Calendar,
} from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/core/formatters/currency";
import { useStore } from "@/features/cart/context/store-context";
import { cn } from "@/core/lib/cn";

export default function CustomerAccountPage() {
  const { orders, activeVehicle, setActiveVehicle } = useStore();
  const [tab, setTab] = useState<"orders" | "vehicle">("orders");

  const [brand, setBrand] = useState(activeVehicle.brand);
  const [model, setModel] = useState(activeVehicle.model);
  const [year, setYear] = useState(activeVehicle.year);
  const [plate, setPlate] = useState(activeVehicle.licensePlate);
  const [odo, setOdo] = useState(activeVehicle.currentOdoKm);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveVehicle({
      id: activeVehicle.id,
      brand,
      model,
      year,
      licensePlate: plate.toUpperCase(),
      currentOdoKm: odo,
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="bg-canvas pb-16">
      <Breadcrumbs items={[{ label: "Tài khoản & Sổ bảo dưỡng" }]} />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Account Sidebar */}
          <aside className="lg:col-span-3">
            <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-5">
              <div className="border-b border-line pb-4">
                <span className="font-mono text-[11px] font-bold uppercase text-brand">
                  THÀNH VIÊN AUTORA
                </span>
                <strong className="mt-1 block font-display text-2xl uppercase text-ink">
                  Nguyễn Minh Khoa
                </strong>
                <span className="text-xs text-ink-secondary">0909 688 912</span>
              </div>

              <nav className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setTab("orders")}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors",
                    tab === "orders"
                      ? "bg-brand text-ink-inverse"
                      : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
                  )}
                >
                  <ClipboardList className="h-4 w-4" />
                  Đơn đặt lịch & Lịch sử ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("vehicle")}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors",
                    tab === "vehicle"
                      ? "bg-brand text-ink-inverse"
                      : "text-ink-secondary hover:bg-surface-subtle hover:text-ink"
                  )}
                >
                  <Car className="h-4 w-4" />
                  Hồ sơ xe của tôi
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Dashboard Area */}
          <div className="lg:col-span-9 space-y-6">
            {tab === "orders" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                  <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
                    LỊCH HẸN & SỔ BẢO DƯỠNG ĐIỆN TỬ
                  </h1>
                  <Button variant="accent" size="sm" asChild>
                    <Link href={ROUTES.SERVICES}>+ ĐẶT THÊM DỊCH VỤ</Link>
                  </Button>
                </div>

                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.orderCode}
                      className="rounded-xl border border-line bg-surface p-6 shadow-xs space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-brand">
                            #{ord.orderCode}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-ink-secondary">
                            <Calendar className="h-3.5 w-3.5 text-brand" />
                            Hẹn lúc {ord.appointmentTime} • {ord.appointmentDate}
                          </span>
                        </div>

                        <Badge
                          variant={
                            ord.status === "HOAN_TAT"
                              ? "default"
                              : "solidAccent"
                          }
                        >
                          {ord.status === "HOAN_TAT"
                            ? "Đã hoàn tất nghiệm thu"
                            : "Đã xác nhận cầu nâng"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs text-ink-secondary">
                        <div>
                          <span className="block uppercase text-[10px]">
                            Garage thực hiện
                          </span>
                          <strong className="text-sm text-ink">
                            {ord.garageName}
                          </strong>
                          <p className="mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-brand" />
                            {ord.garageAddress}
                          </p>
                        </div>
                        <div>
                          <span className="block uppercase text-[10px]">
                            Thông tin xe ghi nhận
                          </span>
                          <strong className="text-sm text-ink">
                            {ord.vehicleLabel}
                          </strong>
                          <p className="mt-0.5 font-mono">
                            Biển số: {ord.licensePlate} • ODO: {ord.odoKm} km
                          </p>
                        </div>
                      </div>

                      <div className="divide-y divide-line rounded-md border border-line bg-surface-subtle/40 px-4 py-2 text-xs">
                        {ord.items.map((it) => (
                          <div
                            key={it.productId}
                            className="flex justify-between py-2"
                          >
                            <span className="text-ink">
                              {it.name} (x{it.quantity})
                            </span>
                            <strong className="font-mono text-ink">
                              {formatVND(it.priceVnd * it.quantity)}
                            </strong>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-ink-secondary">
                          {ord.paymentMethodLabel}
                        </span>
                        <strong className="font-display text-2xl font-extrabold text-brand">
                          {formatVND(ord.totalVnd)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <form
                onSubmit={handleSaveVehicle}
                className="rounded-xl border border-line bg-surface p-6 sm:p-8 shadow-xs space-y-5"
              >
                <h1 className="font-display text-3xl font-extrabold uppercase text-ink border-b border-line pb-3">
                  QUẢN LÝ XE CỦA TÔI
                </h1>
                <p className="text-xs text-ink-secondary">
                  Cập nhật xe mặc định giúp AUTORA tự động điền thông tin khi đặt lịch và gợi ý đúng gói bảo dưỡng tương thích.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label htmlFor="v-brand" className="text-xs text-ink-secondary">
                      Hãng xe
                    </label>
                    <Input
                      id="v-brand"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="v-model" className="text-xs text-ink-secondary">
                      Dòng xe & Phiên bản
                    </label>
                    <Input
                      id="v-model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="v-year" className="text-xs text-ink-secondary">
                      Năm sản xuất
                    </label>
                    <Input
                      id="v-year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="v-plate" className="text-xs text-ink-secondary">
                      Biển kiểm soát
                    </label>
                    <Input
                      id="v-plate"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="v-odo" className="text-xs text-ink-secondary">
                      Số km ODO hiện tại
                    </label>
                    <Input
                      id="v-odo"
                      value={odo}
                      onChange={(e) => setOdo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {savedNotice && (
                  <p className="inline-flex items-center gap-2 text-xs font-medium text-brand">
                    <CheckCircle2 className="h-4 w-4" />
                    Đã lưu thông tin xe lên thanh công cụ thành công!
                  </p>
                )}

                <div>
                  <Button type="submit" variant="primary" size="md">
                    LƯU HỒ SƠ PHƯƠNG TIỆN
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
