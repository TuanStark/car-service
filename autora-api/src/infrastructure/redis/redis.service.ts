import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>("redis.host") ?? "localhost";
    const port = this.configService.get<number>("redis.port") ?? 6380;
    const password = this.configService.get<string>("redis.password") || undefined;
    const db = this.configService.get<number>("redis.db") ?? 0;

    this.client = new Redis({
      host,
      port,
      password,
      db,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 2000),
    });

    this.client.on("error", (err) => {
      this.logger.warn(`Redis connection warning: ${err.message}`);
    });
  }

  get rawClient(): Redis {
    return this.client;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      this.logger.log("Connected to Redis.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not connect to Redis at startup: ${msg}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => {
      this.client.disconnect();
    });
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async setFlag(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, "EX", ttlSeconds);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    return count > 0;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(key, "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  }

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>
  ): Promise<T> {
    const cached = await this.getJson<T>(key).catch(() => null);
    if (cached !== null) {
      return cached;
    }

    const fresh = await loader();
    await this.setJson(key, fresh, ttlSeconds).catch(() => undefined);
    return fresh;
  }
}
