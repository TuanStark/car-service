"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";
import { SITE_CONFIG } from "@/config/site.config";
import { ROUTES } from "@/config/routes.config";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="border-t border-line bg-surface text-ink-secondary">
      {/* Newsletter Bar */}
      <div className="border-b border-line bg-brand-soft/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand">
              ĐĂNG KÝ NHẬN TIN KHUYẾN MÃI
            </span>
            <h3 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold uppercase text-ink">
              NHẬN ƯU ĐÃI BẢO DƯỠNG & THÔNG BÁO MỐC CHĂM XE
            </h3>
          </div>

          {subscribed ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-brand/25 bg-surface px-4 py-3 text-xs font-medium text-ink">
              <CheckCircle2 className="h-4 w-4 text-brand" />
              <span>Đã đăng ký nhận bản tin ưu đãi thành công!</span>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) setSubscribed(true);
              }}
              className="flex w-full max-w-md overflow-hidden rounded-lg border border-line-strong bg-surface shadow-xs"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn..."
                className="h-11 flex-1 bg-transparent px-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 bg-brand px-5 font-display text-sm font-bold uppercase tracking-wider text-white hover:bg-brand-hover cursor-pointer"
              >
                <span>Đăng ký</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Columns */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-4">
            <Link href={ROUTES.HOME} className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white font-display text-xl font-extrabold">
                A
              </span>
              <span className="font-display text-2xl font-extrabold tracking-[0.08em] text-ink">
                AUTORA
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              Nền tảng dịch vụ chăm sóc, bảo dưỡng và phụ tùng ô tô chính hãng tại Việt Nam — minh bạch bảng giá VNĐ, đặt lịch thuận tiện tại các gara xác minh.
            </p>
            <ul className="space-y-2 text-xs text-ink pt-1">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand" />
                <strong>{SITE_CONFIG.hotline}</strong>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand" />
                <span>{SITE_CONFIG.supportEmail}</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand" />
                <span>{SITE_CONFIG.workingHours}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{SITE_CONFIG.headquarters}</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-display text-base font-bold uppercase text-ink">
              Sản phẩm & Dịch vụ
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`${ROUTES.SERVICES}?danh-muc=bao-duong-dinh-ky`} className="hover:text-brand">
                  Bảo dưỡng định kỳ & Dầu nhớt
                </Link>
              </li>
              <li>
                <Link href={`${ROUTES.SERVICES}?danh-muc=lop-va-mam-xe`} className="hover:text-brand">
                  Lốp xe & Cân chỉnh thước lái 3D
                </Link>
              </li>
              <li>
                <Link href={`${ROUTES.SERVICES}?danh-muc=cham-soc-detailing`} className="hover:text-brand">
                  Rửa xe chuyên sâu & Phủ Ceramic
                </Link>
              </li>
              <li>
                <Link href={`${ROUTES.SERVICES}?danh-muc=sua-chua-o-to`} className="hover:text-brand">
                  Kiểm tra OBD-II & Sửa chữa phanh
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-display text-base font-bold uppercase text-ink">
              Hỗ trợ khách hàng
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={ROUTES.GARAGES} className="hover:text-brand">
                  Hệ thống gara
                </Link>
              </li>
              <li>
                <Link href={ROUTES.PRICING} className="hover:text-brand">
                  Bảng giá & Combo
                </Link>
              </li>
              <li>
                <Link href={ROUTES.ACCOUNT} className="hover:text-brand">
                  Sổ bảo dưỡng xe
                </Link>
              </li>
              <li>
                <Link href={ROUTES.BLOG} className="hover:text-brand">
                  Hướng dẫn & Mẹo vặt
                </Link>
              </li>
              <li>
                <Link href={ROUTES.CONTACT} className="hover:text-brand">
                  Liên hệ hợp tác
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-display text-base font-bold uppercase text-ink">
              Đối tác thương hiệu
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-ink">
              {["MICHELIN", "BRIDGESTONE", "MOBIL 1", "TOTALENERGIES", "BOSCH", "3M AUTO"].map(
                (brand) => (
                  <div
                    key={brand}
                    className="rounded-md border border-line bg-surface-subtle/70 px-3 py-2 text-center"
                  >
                    {brand}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 AUTORA Việt Nam — Nền tảng dịch vụ & phụ tùng ô tô.</p>
          <p className="font-mono text-[11px] text-ink-muted">
            Dữ liệu sản phẩm, gara & mức giá hiển thị ở chế độ Demo minh họa.
          </p>
        </div>
      </div>
    </footer>
  );
}
