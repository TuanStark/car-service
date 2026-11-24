"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
} from "lucide-react";
import { SITE_CONFIG } from "@/config/site.config";
import { ROUTES } from "@/config/routes.config";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="border-t border-line bg-surface text-ink-secondary">
      {/* Newsletter Promo Bar (Brand Soft Surface) */}
      <div className="border-b border-line bg-brand-soft/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
              BẢN TIN CHỦ XE VIỆT NAM
            </span>
            <h3 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold uppercase text-ink">
              ĐĂNG KÝ NHẬN ƯU ĐÃI BẢO DƯỠNG & NHẮC LỊCH THAY DẦU!
            </h3>
          </div>

          {subscribed ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-brand/30 bg-surface px-4 py-3 text-xs text-ink shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-brand" />
              <span>Đã đăng ký nhận thông báo ưu đãi dịch vụ thành công!</span>
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
                placeholder="Nhập email nhận voucher giảm 10%..."
                className="h-11 flex-1 bg-transparent px-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-accent px-5 font-display text-sm font-bold uppercase tracking-wider text-ink-inverse hover:bg-accent-hover cursor-pointer transition-colors"
              >
                <span>Đăng ký</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main 4-Column Commercial Footer */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Column 1: Brand & Contact */}
          <div className="lg:col-span-4 space-y-4">
            <Link href={ROUTES.HOME} className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-ink-inverse font-display text-xl font-extrabold">
                A
              </span>
              <span className="font-display text-2xl font-extrabold tracking-[0.1em] text-ink">
                AUTORA
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-ink-secondary">
              Sàn thương mại dịch vụ ô tô minh bạch tại Việt Nam — kết nối chủ xe với các trung tâm bảo dưỡng, sửa chữa kỹ thuật và detailing chính hãng với bảng giá niêm yết VNĐ công khai.
            </p>

            <ul className="space-y-2 text-xs text-ink pt-1">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-brand" />
                <span>
                  Tổng đài CSKH: <strong>{SITE_CONFIG.hotline}</strong>
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-brand" />
                <span>{SITE_CONFIG.supportEmail}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-brand" />
                <span>{SITE_CONFIG.workingHours}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{SITE_CONFIG.headquarters}</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Categories */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-display text-base font-bold uppercase tracking-wider text-ink">
              Danh mục dịch vụ
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href={`${ROUTES.SERVICES}?danh-muc=bao-duong-dinh-ky`}
                  className="hover:text-brand transition-colors"
                >
                  Bảo dưỡng định kỳ (5.000 – 40.000 km)
                </Link>
              </li>
              <li>
                <Link
                  href={`${ROUTES.SERVICES}?danh-muc=sua-chua-o-to`}
                  className="hover:text-brand transition-colors"
                >
                  Kiểm tra OBD-II & Sửa chữa phanh gầm
                </Link>
              </li>
              <li>
                <Link
                  href={`${ROUTES.SERVICES}?danh-muc=cham-soc-detailing`}
                  className="hover:text-brand transition-colors"
                >
                  Vệ sinh nội thất & Phủ Ceramic 9H
                </Link>
              </li>
              <li>
                <Link
                  href={`${ROUTES.SERVICES}?danh-muc=lop-va-mam-xe`}
                  className="hover:text-brand transition-colors"
                >
                  Thay lốp & Căn chỉnh thước lái 3D
                </Link>
              </li>
              <li>
                <Link
                  href={`${ROUTES.SERVICES}?danh-muc=dien-va-dieu-hoa`}
                  className="hover:text-brand transition-colors"
                >
                  Nội soi dàn lạnh & Điện ô tô
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-display text-base font-bold uppercase tracking-wider text-ink">
              Hỗ trợ chủ xe
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href={ROUTES.PRICING} className="hover:text-brand transition-colors">
                  Bảng giá & Combo
                </Link>
              </li>
              <li>
                <Link href={ROUTES.GARAGES} className="hover:text-brand transition-colors">
                  Hệ thống Garage
                </Link>
              </li>
              <li>
                <Link href={ROUTES.ACCOUNT} className="hover:text-brand transition-colors">
                  Tra cứu đơn & Sổ ODO
                </Link>
              </li>
              <li>
                <Link href={ROUTES.CART} className="hover:text-brand transition-colors">
                  Giỏ dịch vụ của bạn
                </Link>
              </li>
              <li>
                <Link href={ROUTES.BLOG} className="hover:text-brand transition-colors">
                  Cẩm nang chăm xe
                </Link>
              </li>
              <li>
                <Link href={ROUTES.CONTACT} className="hover:text-brand transition-colors">
                  Đăng ký đối tác xưởng
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Regional Hubs */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-display text-base font-bold uppercase tracking-wider text-ink">
              Khu vực hoạt động
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="rounded-lg border border-line bg-surface-subtle/60 p-3">
                <strong className="text-brand block">TP. HỒ CHÍ MINH</strong>
                <span>Quận 7 • Bình Thạnh • TP. Thủ Đức • Quận 1</span>
              </div>
              <div className="rounded-lg border border-line bg-surface-subtle/60 p-3">
                <strong className="text-brand block">HÀ NỘI</strong>
                <span>Cầu Giấy • Nam Từ Liêm (Mỹ Đình) • Long Biên</span>
              </div>
              <div className="rounded-lg border border-line bg-surface-subtle/60 p-3">
                <strong className="text-brand block">ĐÀ NẴNG</strong>
                <span>Hải Châu • Sơn Trà • Ngũ Hành Sơn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Payment & Copyright Bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <span>
              © 2026 AUTORA Việt Nam — Dữ liệu sản phẩm/dịch vụ và giá VNĐ hiển thị ở chế độ Demo minh họa.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold text-ink">
            <span className="rounded-sm border border-line bg-surface-subtle px-2.5 py-1">
              THANH TOÁN TẠI XƯỞNG
            </span>
            <span className="rounded-sm border border-line bg-surface-subtle px-2.5 py-1">
              VIETQR 24/7
            </span>
            <span className="rounded-sm border border-line bg-surface-subtle px-2.5 py-1">
              VNPAY / THẺ NỘI ĐỊA
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
