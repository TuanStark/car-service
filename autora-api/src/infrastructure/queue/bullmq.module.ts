import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>("redis.host") ?? "localhost",
          port: configService.get<number>("redis.port") ?? 6380,
          password: configService.get<string>("redis.password") || undefined,
          db: configService.get<number>("redis.db") ?? 0,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1_000,
          },
          removeOnComplete: 500,
          removeOnFail: 1_000,
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
