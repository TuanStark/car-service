"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatVND } from "@/core/formatters/currency";
import { useStore } from "@/features/cart/context/store-context";

export default function CartPage() {
  const {
    cart,
    subtotalVnd,
    couponCode,
    discountVnd,
    totalVnd,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useStore();

  const [couponInput, setCouponInput] = useState(couponCode ?? "");
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyCoupon(couponInput);
    setCouponFeedback(res.message);
  };

  return (
    <div className="bg-canvas pb-16">
      <Breadcrumbs items={[{ label: "Giỏ dịch vụ" }]} />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <h1 className="font-display text-4xl font-extrabold uppercase text-ink">
            GIỎ DỊCH VỤ CỦA BẠN
          </h1>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-medium text-ink-secondary hover:text-accent underline cursor-pointer"
            >
              Làm trống giỏ dịch vụ
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="mt-8 rounded-xl border border-line bg-surface py-16 px-6 text-center shadow-xs">
            <ShoppingBag className="mx-auto h-14 w-14 text-ink-muted/40" />
            <h2 className="mt-4 font-display text-2xl font-bold uppercase text-ink">
              Giỏ dịch vụ đang trống
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">
              Hãy chọn các gói bảo dưỡng định kỳ, sửa chữa hoặc chăm sóc xe từ cửa hàng dịch vụ AUTORA.
            </p>
            <Button variant="primary" size="lg" asChild className="mt-6">
              <Link href={ROUTES.SERVICES}>TIẾP TỤC CHỌN DỊCH VỤ</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Cart Items Table */}
            <div className="lg:col-span-8 space-y-4">
              <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                  >
                    <Link
                      href={ROUTES.SERVICE_DETAIL(item.slug)}
                      className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md border border-line bg-surface-subtle"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="font-mono text-[11px] text-ink-secondary">
                        {item.sku} • {item.categoryLabel} • {item.estimatedDuration}
                      </span>
                      <Link
                        href={ROUTES.SERVICE_DETAIL(item.slug)}
                        className="block text-base font-semibold text-ink hover:text-brand"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-ink-secondary">
                        Đơn giá tham khảo: {formatVND(item.priceVnd)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="inline-flex items-center rounded-md border border-line-strong bg-surface-subtle">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center text-ink-secondary hover:text-ink cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-9 text-center font-mono text-xs font-bold text-ink">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(
                              item.productId,
                              item.quantity + 1
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center text-ink-secondary hover:text-ink cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <strong className="w-28 text-right font-display text-xl font-extrabold text-brand">
                        {formatVND(item.priceVnd * item.quantity)}
                      </strong>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        aria-label="Xóa mục này"
                        className="text-ink-muted hover:text-accent cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Bar */}
              <form
                onSubmit={handleApplyCoupon}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 shadow-xs sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink shrink-0">
                  <Tag className="h-4 w-4 text-brand" />
                  <span>Mã ưu đãi:</span>
                </div>
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Nhập mã AUTORA10 giảm 10%..."
                  className="h-10 flex-1 text-xs"
                />
                <Button type="submit" variant="secondary" size="sm" className="h-10">
                  ÁP DỤNG MÃ
                </Button>
                {couponCode && (
                  <button
                    type="button"
                    onClick={() => {
                      removeCoupon();
                      setCouponFeedback(null);
                    }}
                    className="text-xs text-ink-secondary underline cursor-pointer"
                  >
                    Gỡ mã
                  </button>
                )}
              </form>
              {couponFeedback && (
                <p className="text-xs font-medium text-brand">{couponFeedback}</p>
              )}
            </div>

            {/* Order Totals Sidebar */}
            <aside className="lg:col-span-4">
              <div className="rounded-xl border border-line bg-surface p-6 shadow-xs space-y-5 sticky top-28">
                <h2 className="font-display text-2xl font-extrabold uppercase text-ink border-b border-line pb-3">
                  TÓM TẮT ĐƠN DỊCH VỤ
                </h2>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-ink-secondary">
                    <span>Tạm tính ({cart.length} hạng mục):</span>
                    <span className="text-ink font-medium">
                      {formatVND(subtotalVnd)}
                    </span>
                  </div>

                  <div className="flex justify-between text-ink-secondary">
                    <span>Phí đặt lịch trước:</span>
                    <span className="text-ink font-medium">Miễn phí (0đ)</span>
                  </div>

                  {discountVnd > 0 && (
                    <div className="flex justify-between text-accent font-medium">
                      <span>Mã giảm giá ({couponCode}):</span>
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

                <Button variant="accent" size="lg" asChild className="w-full">
                  <Link href={ROUTES.CHECKOUT}>
                    TIẾN HÀNH CHỌN LỊCH & XÁC NHẬN
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <div className="flex items-start gap-2 text-xs text-ink-secondary pt-1">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>
                    Không cần thanh toán trước. Bạn chỉ thanh toán trực tiếp tại garage sau khi cố vấn báo giá chính thức và nghiệm thu xe.
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
