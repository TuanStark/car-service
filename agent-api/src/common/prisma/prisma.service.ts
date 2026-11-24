import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { loadEnv } from "@/common/config/env.config";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  get isEnabled(): boolean {
    const env = loadEnv();
    return env.STORAGE_DRIVER === "prisma" && Boolean(env.DATABASE_URL);
  }

  get isConnected(): boolean {
    return this.connected;
  }

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.log("STORAGE_DRIVER=memory — running with in-memory store.");
      return;
    }

    try {
      await this.$connect();
      this.connected = true;
      this.logger.log("Connected to PostgreSQL (pgvector) via Prisma.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Could not connect to PostgreSQL (${msg}). Falling back to in-memory store.`
      );
      this.connected = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.connected) {
      await this.$disconnect();
    }
  }
}

