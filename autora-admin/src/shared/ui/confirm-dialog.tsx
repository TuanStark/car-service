"use client";

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";
import { Textarea } from "./input";

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly tone?: "primary" | "danger";
  readonly requireReason?: boolean;
  readonly reasonLabel?: string;
  readonly reasonPlaceholder?: string;
  readonly isPending?: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (reason?: string) => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Hủy bỏ",
  tone = "primary",
  requireReason = false,
  reasonLabel = "Lý do thực hiện *",
  reasonPlaceholder = "Nhập lý do rõ ràng...",
  isPending = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      setReasonError("Vui lòng nhập lý do trước khi xác nhận.");
      return;
    }
    setReasonError(null);
    await onConfirm(reason.trim() || undefined);
    setReason("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex items-center gap-2.5">
            {tone === "danger" && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <AlertTriangle className="h-4 w-4" />
              </span>
            )}
            <h3 id="confirm-dialog-title" className="text-sm font-bold text-ink">
              {title}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md p-1 text-ink-muted hover:bg-surface-subtle hover:text-ink cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-xs sm:text-sm leading-relaxed text-ink-secondary">
            {description}
          </p>

          {requireReason && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">
                {reasonLabel}
              </label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (reasonError) setReasonError(null);
                }}
                placeholder={reasonPlaceholder}
                disabled={isPending}
              />
              {reasonError && (
                <p className="text-xs font-medium text-rose-600">{reasonError}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-subtle/60 px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={() => void handleConfirm()}
            disabled={isPending}
          >
            {isPending ? "Đang xử lý..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

