import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppConfigModule } from "@config/config.module";
import { AllExceptionsFilter } from "@core/exceptions/all-exceptions.filter";
import { JwtAuthGuard } from "@core/guards/jwt-auth.guard";
import { IdempotencyInterceptor } from "@core/interceptors/idempotency.interceptor";
import { TransformResponseInterceptor } from "@core/interceptors/transform-response.interceptor";
import { CorrelationIdMiddleware } from "@core/middlewares/correlation-id.middleware";
import { HealthModule } from "@infra/health/health.module";
import { AppLoggerModule } from "@infra/observability/logger.module";
import { PrismaModule } from "@infra/prisma/prisma.module";
import { QueueModule } from "@infra/queue/bullmq.module";
import { RedisModule } from "@infra/redis/redis.module";
import { AuditModule } from "@modules/audit/audit.module";
import { BookingsModule } from "@modules/bookings/bookings.module";
import { CatalogModule } from "@modules/catalog/catalog.module";
import { CustomersModule } from "@modules/customers/customers.module";
import { DashboardModule } from "@modules/dashboard/dashboard.module";
import { GaragesModule } from "@modules/garages/garages.module";
import { IamModule } from "@modules/iam/iam.module";
import { InventoryModule } from "@modules/inventory/inventory.module";
import { MediaModule } from "@modules/media/media.module";
import { ProcurementModule } from "@modules/procurement/procurement.module";
import { EquipmentModule } from "@modules/equipment/equipment.module";
import { WorkforceModule } from "@modules/workforce/workforce.module";

@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: ".",
      maxListeners: 20,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>("throttle.ttlMs") ?? 60_000,
            limit: configService.get<number>("throttle.limit") ?? 100,
          },
        ],
      }),
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    HealthModule,
    IamModule,
    CatalogModule,
    BookingsModule,
    GaragesModule,
    CustomersModule,
    DashboardModule,
    AuditModule,
    MediaModule,
    InventoryModule,
    ProcurementModule,
    EquipmentModule,
    WorkforceModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}
