import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { RedisContainer, type StartedRedisContainer } from "@testcontainers/redis";

export interface TestInfrastructureHandle {
  readonly postgres: StartedPostgreSqlContainer;
  readonly redis: StartedRedisContainer;
  readonly databaseUrl: string;
  readonly redisHost: string;
  readonly redisPort: number;
  stop(): Promise<void>;
}

export async function startTestContainers(): Promise<TestInfrastructureHandle> {
  const [postgres, redis] = await Promise.all([
    new PostgreSqlContainer("postgres:16.8-alpine")
      .withDatabase("autora_test")
      .withUsername("autora_test")
      .withPassword("autora_test_pw")
      .start(),
    new RedisContainer("redis:7.4-alpine").start(),
  ]);

  return {
    postgres,
    redis,
    databaseUrl: postgres.getConnectionUri(),
    redisHost: redis.getHost(),
    redisPort: redis.getMappedPort(6379),
    async stop() {
      await Promise.all([postgres.stop(), redis.stop()]);
    },
  };
}
