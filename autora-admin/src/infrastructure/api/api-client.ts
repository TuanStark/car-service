import type {
  ApiEnvelope,
  PaginationMeta,
  ProblemDetails,
} from "@/shared/types/api.types";
import { tokenStore } from "../auth/token-store";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode?: string;
  readonly validationErrors?: readonly string[];
  readonly requestId?: string;

  constructor(params: {
    message: string;
    status: number;
    errorCode?: string;
    validationErrors?: readonly string[];
    requestId?: string;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.errorCode = params.errorCode;
    this.validationErrors = params.validationErrors;
    this.requestId = params.requestId;
  }
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly meta: PaginationMeta;
}

let activeRefreshPromise: Promise<string | null> | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        tokenStore.clear();
        return null;
      }
      const envelope = (await res.json()) as ApiEnvelope<{
        accessToken: string;
      }>;
      const newToken = envelope.data.accessToken;
      tokenStore.set(newToken);
      return newToken;
    } catch {
      tokenStore.clear();
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  try {
    const problem = (await res.json()) as Partial<ProblemDetails>;
    const message =
      problem.errors && problem.errors.length > 0
        ? problem.errors.join(" ")
        : problem.detail || `Yêu cầu thất bại (HTTP ${res.status}).`;

    return new ApiError({
      message,
      status: problem.status ?? res.status,
      errorCode: problem.errorCode,
      validationErrors: problem.errors,
      requestId: problem.requestId,
    });
  } catch {
    return new ApiError({
      message: `Lỗi kết nối máy chủ (HTTP ${res.status}).`,
      status: res.status,
    });
  }
}

interface RequestOptions {
  readonly method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly body?: unknown;
  readonly skipAuthRefresh?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiEnvelope<T>> {
  const execute = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      credentials: "include",
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  };

  let res = await execute(tokenStore.get());

  if (res.status === 401 && !options.skipAuthRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await execute(refreshed);
    } else {
      unauthorizedHandler?.();
    }
  }

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  return (await res.json()) as ApiEnvelope<T>;
}

export async function apiData<T>(
  path: string,
  options?: RequestOptions
): Promise<T> {
  const envelope = await apiRequest<T>(path, options);
  return envelope.data;
}

export async function apiPaginated<T>(
  path: string
): Promise<PaginatedResponse<T>> {
  const envelope = await apiRequest<T[]>(path);
  return {
    items: envelope.data,
    meta: envelope.meta ?? {
      page: 1,
      limit: envelope.data.length || 15,
      totalItems: envelope.data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}

