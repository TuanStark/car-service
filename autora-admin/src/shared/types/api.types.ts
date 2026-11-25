export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPrevPage: boolean;
}

export interface ApiEnvelope<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: PaginationMeta;
  readonly requestId: string;
  readonly timestamp: string;
}

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance: string;
  readonly requestId?: string;
  readonly errorCode?: string;
  readonly errors?: readonly string[];
}

