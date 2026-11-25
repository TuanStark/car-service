"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface ToastItem {
  readonly id: number;
  readonly type: "success" | "error";
  readonly message: string;
}

interface ToastContextValue {
  readonly notifySuccess: (message: string) => void;
  readonly notifyError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const notifySuccess = useCallback(
    (message: string) => push("success", message),
    [push]
  );
  const notifyError = useCallback(
    (message: string) => push("error", message),
    [push]
  );

  return (
    <ToastContext.Provider value={{ notifySuccess, notifyError }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[70] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium shadow-lg ${
              t.type === "success"
                ? "border-emerald-200 bg-white text-ink"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== t.id))
              }
              className="text-ink-muted hover:text-ink cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast phải được dùng bên trong ToastProvider");
  }
  return ctx;
}

