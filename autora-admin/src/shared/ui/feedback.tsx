"use client";

import React from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, ShieldAlert } from "lucide-react";
import type { PaginationMeta } from "@/shared/types/api.types";
import { Button } from "./button";

export function Pagination({
  meta,
  onPageChange,
}: {
  readonly meta: PaginationMeta;
  readonly onPageChange: (nextPage: number) => void;
}) {
  if (meta.totalPages <= 1 && meta.totalItems <= meta.limit) {
    return (
      <div className="border-t border-line px-5 py-3 text-xs text-ink-secondary">
        Tổng cộng <strong className="text-ink tabular-nums">{meta.totalItems}</strong> bản ghi
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-xs text-ink-secondary">
      <span>
        Trang <strong className="text-ink tabular-nums">{meta.page}</strong> /{" "}
        <strong className="text-ink tabular-nums">{meta.totalPages}</strong> • Tổng{" "}
        <strong className="text-ink tabular-nums">{meta.totalItems}</strong> bản ghi
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Trước
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Sau
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  cols = 5,
}: {
  readonly rows?: number;
  readonly cols?: number;
}) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="grid gap-4 px-5 py-3.5"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((__, cIdx) => (
            <div
              key={cIdx}
              className="h-4 animate-pulse rounded bg-slate-200/80"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  readonly title: string;
  readonly description: string;
  readonly action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface-subtle text-ink-muted">
        <Inbox className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-ink-secondary">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  status,
  onRetry,
}: {
  readonly message: string;
  readonly status?: number;
  readonly onRetry?: () => void;
}) {
  const isForbidden = status === 403;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/60 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
        {isForbidden ? (
          <ShieldAlert className="h-5 w-5" />
        ) : (
          <AlertTriangle className="h-5 w-5" />
        )}
      </span>
      <h3 className="mt-3 text-sm font-bold text-ink">
        {isForbidden ? "Không có quyền truy cập" : "Không thể tải dữ liệu"}
      </h3>
      <p className="mt-1 max-w-md text-xs text-ink-secondary">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

