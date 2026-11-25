import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  HealthCheck,
  type HealthCheckResult,
  HealthCheckService,
  type HealthIndicatorResult,
} from "@nestjs/terminus";
import { Public } from "@core/decorators/public.decorator";
import { PrismaService } from "@infra/prisma/prisma.service";
import { RedisService } from "@infra/redis/redis.service";

@ApiTags("Health")
@Controller({ path: "health", version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  @Public()
  @Get("live")
  @HealthCheck()
  @ApiOperation({ summary: "Kubernetes Liveness Probe" })
  live(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @Public()
  @Get("ready")
  @HealthCheck()
  @ApiOperation({ summary: "Kubernetes Readiness Probe (PostgreSQL + Redis)" })
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        await this.prisma.ping();
        return { postgres: { status: "up" } };
      },
      async (): Promise<HealthIndicatorResult> => {
        const pong = await this.redis.ping();
        if (pong !== "PONG") {
          throw new Error("Redis ping failed");
        }
        return { redis: { status: "up" } };
      },
    ]);
  }
}
