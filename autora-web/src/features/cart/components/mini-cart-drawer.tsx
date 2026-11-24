"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { ROUTES } from "@/config/routes.config";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/core/formatters/currency";
import { useStore } from "../context/store-context";

export function MiniCartDrawer() {
  const {
    cart,
    cartCount,
    subtotalVnd,
    discountVnd,
    totalVnd,
    isMiniCartOpen,
    setMiniCartOpen,
    updateCartQuantity,
    removeFromCart,
  } = useStore();

  if (!isMiniCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={() => setMiniCartOpen(false)}
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
      />

      {/* Slide-over Light Panel */}
      <aside
        aria-label="Giỏ dịch vụ của bạn"
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-surface-subtle px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-brand" />
            <h2 className="font-display text-xl font-extrabold uppercase tracking-wide text-ink">
              Giỏ dịch vụ ({cartCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setMiniCartOpen(false)}
            aria-label="Đóng giỏ dịch vụ"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface text-ink-secondary hover:border-brand hover:text-brand cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cart Items */}
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-ink-muted/50" />
            <p className="mt-4 font-display text-xl font-bold uppercase text-ink">
              Chưa có gói dịch vụ nào trong giỏ
            </p>
            <p className="mt-1.5 text-xs text-ink-secondary">
              Khám phá các gói bảo dưỡng định kỳ, vệ sinh nội thất hoặc phủ Ceramic với giá niêm yết rõ ràng.
            </p>
            <Button
              variant="primary"
              size="md"
              asChild
              className="mt-6"
              onClick={() => setMiniCartOpen(false)}
            >
              <Link href={ROUTES.SERVICES}>KHÁM PHÁ CỬA HÀNG DỊCH VỤ</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y divide-line px-5">
              {cart.map((item) => (
                <div key={item.productId} className="flex gap-3.5 py-4">
                  <Link
                    href={ROUTES.SERVICE_DETAIL(item.slug)}
                    onClick={() => setMiniCartOpen(false)}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-line bg-surface-subtle"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={ROUTES.SERVICE_DETAIL(item.slug)}
                          onClick={() => setMiniCartOpen(false)}
                          className="line-clamp-2 text-xs font-semibold leading-snug text-ink hover:text-brand"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          aria-label="Xóa khỏi giỏ"
                          className="text-ink-muted hover:text-accent cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="mt-0.5 block font-mono text-[10px] text-ink-secondary">
                        Mã: {item.sku} • {item.estimatedDuration}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-md border border-line bg-surface-subtle">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          aria-label="Giảm số lượng"
                          className="flex h-7 w-7 items-center justify-center text-ink-secondary hover:text-ink cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center font-mono text-xs font-semibold text-ink">
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
                          aria-label="Tăng số lượng"
                          className="flex h-7 w-7 items-center justify-center text-ink-secondary hover:text-ink cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <strong className="font-display text-base font-extrabold text-brand">
                        {formatVND(item.priceVnd * item.quantity)}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Summary */}
            <div className="border-t border-line bg-surface-subtle p-5 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-ink-secondary">
                  <span>Tạm tính (Giá tham khảo):</span>
                  <span className="text-ink font-medium">
                    {formatVND(subtotalVnd)}
                  </span>
                </div>
                {discountVnd > 0 && (
                  <div className="flex justify-between text-accent font-medium">
                    <span>Ưu đãi mã giảm giá:</span>
                    <span>-{formatVND(discountVnd)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-2 text-sm">
                  <strong className="text-ink">Tổng dự kiến:</strong>
                  <strong className="font-display text-2xl font-extrabold text-brand">
                    {formatVND(totalVnd)}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="secondary"
                  size="md"
                  asChild
                  onClick={() => setMiniCartOpen(false)}
                >
                  <Link href={ROUTES.CART}>XEM GIỎ HÀNG</Link>
                </Button>
                <Button
                  variant="accent"
                  size="md"
                  asChild
                  onClick={() => setMiniCartOpen(false)}
                >
                  <Link
                    href={ROUTES.CHECKOUT}
                    data-agent-target="nav.checkout"
                  >
                    ĐẶT LỊCH NGAY
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
