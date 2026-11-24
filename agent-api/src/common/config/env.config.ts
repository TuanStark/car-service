import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4100),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3030"),

  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  STORAGE_DRIVER: z.enum(["memory", "prisma"]).default("memory"),

  LLM_PROVIDER: z
    .enum(["auto", "openrouter", "gemini", "agy", "mock"])
    .default("auto"),

  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("google/gemini-2.5-flash"),
  OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

  AGY_CLI_ENABLED: z
    .string()
    .default("true")
    .transform((v) => v !== "false"),
  AGY_CLI_BIN: z.string().default("agy"),
  AGY_CLI_TIMEOUT_MS: z.coerce.number().int().positive().default(25000),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(30),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function loadEnv(): AppEnv {
  return EnvSchema.parse(process.env);
}
