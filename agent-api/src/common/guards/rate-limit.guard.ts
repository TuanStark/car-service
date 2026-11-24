import {
  Injectable,
  HttpException,
  HttpStatus,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { loadEnv } from "@/common/config/env.config";

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const env = loadEnv();
    const req = context.switchToHttp().getRequest<{
      ip?: string;
      params?: { sessionId?: string };
    }>();

    const key = req.params?.sessionId ?? req.ip ?? "global";
    const now = Date.now();
    const windowStart = now - env.RATE_LIMIT_WINDOW_MS;

    const existing = this.buckets.get(key) ?? [];
    const recent = existing.filter((ts) => ts > windowStart);

    if (recent.length >= env.RATE_LIMIT_MAX_REQUESTS) {
      throw new HttpException(
        "Bạn đang gửi yêu cầu quá nhanh. Vui lòng thử lại sau giây lát.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    recent.push(now);
    this.buckets.set(key, recent);
    return true;
  }
}
