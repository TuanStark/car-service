import React from "react";
import { cn } from "@/shared/utils/format";

export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "brand";

const TONE_MAP: Record<BadgeTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  brand: "border-blue-200 bg-blue-50 text-brand",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
};

export function StatusPill({
  label,
  tone = "neutral",
  className,
}: {
  readonly label: string;
  readonly tone?: BadgeTone;
  readonly className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        TONE_MAP[tone],
        className
      )}
    >
      {label}
    </span>
  );
}

const BOOKING_STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING_CONFIRMATION: { label: "Chờ xác nhận", tone: "warning" },
  CONFIRMED: { label: "Đã xác nhận", tone: "info" },
  CHECKED_IN: { label: "Đã tiếp nhận xe", tone: "brand" },
  IN_PROGRESS: { label: "Đang thực hiện", tone: "brand" },
  WAITING_APPROVAL: { label: "Chờ duyệt phát sinh", tone: "warning" },
  QC_PENDING: { label: "Đang kiểm tra QC", tone: "info" },
  READY_FOR_PICKUP: { label: "Sẵn sàng giao xe", tone: "success" },
  COMPLETED: { label: "Hoàn tất", tone: "success" },
  CANCELLED: { label: "Đã hủy", tone: "danger" },
  NO_SHOW: { label: "Khách không đến", tone: "neutral" },
};

const PAYMENT_STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  UNPAID: { label: "Chưa thanh toán", tone: "warning" },
  PAID: { label: "Đã thanh toán", tone: "success" },
  REFUNDED: { label: "Đã hoàn tiền", tone: "neutral" },
};

const GARAGE_STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: "Đang hoạt động", tone: "success" },
  INACTIVE: { label: "Tạm ngưng", tone: "warning" },
  SUSPENDED: { label: "Đình chỉ", tone: "danger" },
};

const USER_STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: "Hoạt động", tone: "success" },
  INACTIVE: { label: "Chưa kích hoạt", tone: "warning" },
  SUSPENDED: { label: "Đã khóa", tone: "danger" },
};

export function BookingStatusBadge({ status }: { readonly status: string }) {
  const meta = BOOKING_STATUS_META[status] ?? { label: status, tone: "neutral" as const };
  return <StatusPill label={meta.label} tone={meta.tone} />;
}

export function PaymentStatusBadge({ status }: { readonly status: string }) {
  const meta = PAYMENT_STATUS_META[status] ?? { label: status, tone: "neutral" as const };
  return <StatusPill label={meta.label} tone={meta.tone} />;
}

export function GarageStatusBadge({ status }: { readonly status: string }) {
  const meta = GARAGE_STATUS_META[status] ?? { label: status, tone: "neutral" as const };
  return <StatusPill label={meta.label} tone={meta.tone} />;
}

export function UserStatusBadge({ status }: { readonly status: string }) {
  const meta = USER_STATUS_META[status] ?? { label: status, tone: "neutral" as const };
  return <StatusPill label={meta.label} tone={meta.tone} />;
}

