import React from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { GarageDirectoryClient } from "@/features/garages/components/garage-directory-client";

export const metadata: Metadata = {
  title: "Hệ thống Garage & Xưởng Detailing xác minh — AUTORA",
  description:
    "Tìm kiếm garage sửa chữa, bảo dưỡng định kỳ và detailing uy tín tại TP.HCM, Hà Nội, Đà Nẵng.",
};

export default function GarageDirectoryPage() {
  return (
    <div className="bg-canvas pb-16">
      <Breadcrumbs items={[{ label: "Hệ thống Garage" }]} />
      <div className="border-b border-line bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-brand">
            MẠNG LƯỚI ĐỐI TÁC TOÀN QUỐC
          </span>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl font-extrabold uppercase text-ink">
            HỆ THỐNG GARAGE & TRUNG TÂM CHĂM SÓC XE
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
            Mỗi gian hàng garage trên AUTORA đều công khai bảng giá dịch vụ tham khảo, hình ảnh khoang cầu nâng và đánh giá từ chủ xe thực tế.
          </p>
        </div>
      </div>
      <GarageDirectoryClient />
    </div>
  );
}
