"use client";

import React, { useState } from "react";
import { Phone, Mail, MapPin, CheckCircle2, Building2 } from "lucide-react";
import { SITE_CONFIG } from "@/config/site.config";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="bg-canvas pb-16">
      <Breadcrumbs items={[{ label: "Liên hệ & Hợp tác" }]} />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-line pb-4">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-brand">
            HỖ TRỢ CHỦ XE 24/7 & PHÁT TRIỂN ĐỐI TÁC XƯỞNG
          </span>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl font-extrabold uppercase text-ink">
            LIÊN HỆ VỚI AUTORA VIỆT NAM
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-line bg-surface p-6 shadow-xs space-y-4">
              <h2 className="font-display text-2xl font-bold uppercase text-ink">
                Văn phòng điều hành
              </h2>
              <ul className="space-y-3 text-sm text-ink-secondary">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-ink">{SITE_CONFIG.headquarters}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-brand" />
                  <span>
                    Tổng đài CSKH: <strong className="text-ink">{SITE_CONFIG.hotline}</strong>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-brand" />
                  <span>{SITE_CONFIG.supportEmail}</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-line bg-brand-soft/50 p-6 space-y-3">
              <h3 className="font-display text-xl font-bold uppercase text-ink flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand" />
                Dành cho Chủ Garage / Xưởng Detailing
              </h3>
              <p className="text-xs leading-relaxed text-ink-secondary">
                Trở thành gian hàng đối tác xác minh trên sàn dịch vụ AUTORA để tiếp cận hàng chục nghìn chủ xe cá nhân tại TP.HCM, Hà Nội và Đà Nẵng.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-line bg-surface p-6 sm:p-8 shadow-xs">
            {sent ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="mx-auto h-12 w-12 text-brand" />
                <h2 className="font-display text-2xl font-bold uppercase text-ink">
                  Đã gửi yêu cầu tư vấn thành công!
                </h2>
                <p className="text-xs text-ink-secondary">
                  Bộ phận Chăm sóc khách hàng hoặc Phát triển đối tác của AUTORA sẽ liên hệ trong vòng 30 phút làm việc.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="space-y-4"
              >
                <h2 className="font-display text-2xl font-bold uppercase text-ink">
                  Gửi yêu cầu tư vấn kỹ thuật / Đăng ký đối tác
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="ct-name" className="text-xs text-ink-secondary">
                      Họ và tên *
                    </label>
                    <Input id="ct-name" placeholder="Nguyễn Văn An" required />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="ct-phone" className="text-xs text-ink-secondary">
                      Số điện thoại *
                    </label>
                    <Input id="ct-phone" type="tel" placeholder="0909..." required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ct-topic" className="text-xs text-ink-secondary">
                    Nhu cầu liên hệ
                  </label>
                  <select
                    id="ct-topic"
                    className="h-11 w-full rounded-md border border-line-strong bg-surface px-4 text-sm text-ink focus:border-brand focus:outline-none"
                  >
                    <option>Tư vấn gói bảo dưỡng & báo giá theo dòng xe</option>
                    <option>Đăng ký mở gian hàng Garage đối tác trên AUTORA</option>
                    <option>Hợp tác bảo dưỡng đội xe doanh nghiệp</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ct-msg" className="text-xs text-ink-secondary">
                    Nội dung chi tiết *
                  </label>
                  <textarea
                    id="ct-msg"
                    rows={4}
                    required
                    placeholder="Nhập dòng xe hoặc tên xưởng dịch vụ cần hỗ trợ..."
                    className="w-full rounded-md border border-line-strong bg-surface p-4 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none"
                  />
                </div>

                <Button type="submit" variant="primary" size="lg">
                  GỬI YÊU CẦU NGAY
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
