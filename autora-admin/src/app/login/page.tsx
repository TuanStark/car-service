"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { ApiError } from "@/infrastructure/api/api-client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const { status, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ Email và Mật khẩu quản trị.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Không thể đăng nhập. Vui lòng kiểm tra kết nối máy chủ.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-7 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-line pb-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white font-bold text-lg">
            A
          </span>
          <div>
            <h1 className="text-base font-bold text-ink">
              AUTORA Quản trị Vận hành
            </h1>
            <p className="text-xs text-ink-secondary">
              Cổng quản lý lịch hẹn, garage đối tác và dịch vụ ô tô
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
            >
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="block text-xs font-semibold text-ink">
              Email quản trị viên
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder="admin@autora.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="h-10 pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="block text-xs font-semibold text-ink">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="h-10 pl-9"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Đang xác thực..." : "Đăng nhập hệ thống"}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-2 rounded-lg border border-line bg-surface-subtle/70 px-3 py-2.5 text-[11px] text-ink-secondary">
          <ShieldCheck className="h-4 w-4 shrink-0 text-brand" />
          <span>
            Chỉ tài khoản có vai trò <strong>Quản trị viên (Admin)</strong> mới được phép truy cập.
          </span>
        </div>
      </div>
    </div>
  );
}

