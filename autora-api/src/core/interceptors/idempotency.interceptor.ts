import {
  BadRequestException,
  type CallHandler,
  ConflictException,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";
import { type Observable, of, tap } from "rxjs";
import { IDEMPOTENT_KEY } from "@core/decorators/idempotent.decorator";
import { RedisService } from "@infra/redis/redis.service";

interface CachedIdempotencyRecord {
  readonly status: "processing" | "completed";
  readonly response?: unknown;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<unknown>> {
    const isIdempotent = this.reflector.getAllAndOverride<boolean>(
      IDEMPOTENT_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!isIdempotent) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const rawKey = request.headers["idempotency-key"];
    const idempotencyKey =
      typeof rawKey === "string" ? rawKey.trim() : "";

    if (!idempotencyKey || idempotencyKey.length > 128) {
      throw new BadRequestException(
        "Header Idempotency-Key là bắt buộc (tối đa 128 ký tự) cho thao tác này."
      );
    }

    const cacheKey = `idemp:${request.method}:${request.url}:${idempotencyKey}`;
    const existing = await this.redisService.getJson<CachedIdempotencyRecord>(cacheKey);

    if (existing) {
      if (existing.status === "processing") {
        throw new ConflictException(
          "Yêu cầu trùng lặp đang được xử lý. Vui lòng chờ."
        );
      }
      return of(existing.response);
    }

    const acquired = await this.redisService.acquireLock(cacheKey, 30);
    if (!acquired) {
      throw new ConflictException(
        "Yêu cầu trùng lặp đang được xử lý. Vui lòng chờ."
      );
    }

    await this.redisService.setJson<CachedIdempotencyRecord>(
      cacheKey,
      { status: "processing" },
      30
    );

    const ttlSeconds =
      this.configService.get<number>("throttle.idempotencyTtlSeconds") ?? 86_400;

    return next.handle().pipe(
      tap({
        next: (response) => {
          void this.redisService.setJson<CachedIdempotencyRecord>(
            cacheKey,
            { status: "completed", response },
            ttlSeconds
          );
        },
        error: () => {
          void this.redisService.del(cacheKey);
        },
      })
    );
  }
}
