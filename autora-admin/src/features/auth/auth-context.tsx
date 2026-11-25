"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  apiData,
  ApiError,
  refreshAccessToken,
  registerUnauthorizedHandler,
} from "@/infrastructure/api/api-client";
import { tokenStore } from "@/infrastructure/auth/token-store";

export interface AdminUser {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly roles: readonly string[];
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  readonly user: AdminUser | null;
  readonly status: AuthStatus;
  readonly login: (email: string, password: string) => Promise<void>;
  readonly logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearSession();
      router.replace("/login");
    });

    let active = true;
    const bootstrap = async () => {
      const refreshed = await refreshAccessToken();
      if (!active) return;

      if (!refreshed) {
        clearSession();
        return;
      }

      try {
        const me = await apiData<AdminUser>("/auth/me");
        if (!active) return;
        const allowedRoles = ["admin", "ops_staff", "partner_staff", "technician"];
        if (!me.roles.some((r) => allowedRoles.includes(r))) {
          clearSession();
          return;
        }
        setUser(me);
        setStatus("authenticated");
      } catch {
        if (active) clearSession();
      }
    };

    void bootstrap();
    return () => {
      active = false;
    };
  }, [clearSession, router]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await apiData<{ accessToken: string }>("/auth/login", {
      method: "POST",
      body: { email: email.trim(), password },
      skipAuthRefresh: true,
    });

    tokenStore.set(tokens.accessToken);
    const me = await apiData<AdminUser>("/auth/me", { skipAuthRefresh: true });

    const allowedRoles = ["admin", "ops_staff", "partner_staff", "technician"];
    if (!me.roles.some((r) => allowedRoles.includes(r))) {
      try {
        await apiData("/auth/logout", {
          method: "POST",
          body: {},
          skipAuthRefresh: true,
        });
      } catch {
        // Ignore logout cleanup failure
      }
      tokenStore.clear();
      setUser(null);
      setStatus("unauthenticated");
      throw new ApiError({
        message:
          "Tài khoản này không có quyền Quản trị viên (Admin) để truy cập hệ thống.",
        status: 403,
      });
    }

    setUser(me);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiData("/auth/logout", {
        method: "POST",
        body: {},
        skipAuthRefresh: true,
      });
    } catch {
      // Proceed with local sign-out even if token is already expired
    }
    clearSession();
    router.replace("/login");
  }, [clearSession, router]);

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return ctx;
}

