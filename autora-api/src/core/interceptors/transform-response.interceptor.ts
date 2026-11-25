import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { map, type Observable } from "rxjs";
import {
  CORRELATION_ID_HEADER,
  RequestContext,
} from "@core/middlewares/correlation-id.middleware";

export interface ApiResponseEnvelope<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: Record<string, unknown>;
  readonly requestId: string;
  readonly timestamp: string;
}

function isPaginatedPayload(
  value: unknown
): value is { items: unknown; meta: Record<string, unknown> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "items" in value &&
    "meta" in value &&
    typeof (value as { meta: unknown }).meta === "object"
  );
}

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponseEnvelope<unknown> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<ApiResponseEnvelope<unknown> | T> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    if (request.url.startsWith("/health")) {
      return next.handle();
    }

    const requestId =
      RequestContext.getRequestId() ??
      (typeof request.headers[CORRELATION_ID_HEADER] === "string"
        ? request.headers[CORRELATION_ID_HEADER]
        : "unknown");

    return next.handle().pipe(
      map((payload) => {
        const timestamp = new Date().toISOString();

        if (isPaginatedPayload(payload)) {
          return {
            success: true as const,
            data: payload.items,
            meta: payload.meta,
            requestId,
            timestamp,
          };
        }

        return {
          success: true as const,
          data: payload,
          requestId,
          timestamp,
        };
      })
    );
  }
}
