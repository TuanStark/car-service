import { z } from "zod";

const booleanStringSchema = z.union([z.boolean(), z.string()]).transform((val) => {
  if (typeof val === "boolean") return val;
  return val.toLowerCase() === "true" || val === "1";
});

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  APP_NAME: z.string().min(1).default("autora-api"),
  APP_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  APP_URL: z.string().url().default("http://localhost:4000"),
  API_PREFIX: z.string().min(1).default("api"),
  CORS_ORIGINS: z
    .string()
    .min(1)
    .default("http://localhost:3000,http://localhost:3030,http://localhost:4100")
    .transform((val) =>
      val
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),

  DATABASE_URL: z
    .string()
    .url()
    .refine((url) => url.startsWith("postgresql://") || url.startsWith("postgres://"), {
      message: "DATABASE_URL must be a valid PostgreSQL connection string",
    })
    .default("postgresql://autora:autora_dev_password@localhost:5433/autora_db?schema=public"),
  DATABASE_SLOW_QUERY_MS: z.coerce.number().int().positive().default(200),

  REDIS_HOST: z.string().min(1).default("localhost"),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6380),
  REDIS_PASSWORD: z.string().optional().default(""),
  REDIS_DB: z.coerce.number().int().min(0).max(15).default(0),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters")
    .default("dev_only_jwt_access_secret_key_change_in_production_32ch"),
  JWT_ACCESS_EXPIRES_IN: z.string().min(2).default("15m"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters")
    .default("dev_only_jwt_refresh_secret_key_change_in_production_32ch"),
  JWT_REFRESH_EXPIRES_IN: z.string().min(2).default("7d"),
  COOKIE_SECRET: z
    .string()
    .min(32, "COOKIE_SECRET must be at least 32 characters")
    .default("dev_only_cookie_signing_secret_change_in_production_32ch"),
  COOKIE_SECURE: booleanStringSchema.default(false),
  COOKIE_DOMAIN: z.string().optional(),

  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(86_400),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  OTEL_ENABLED: booleanStringSchema.default(false),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),

  SMTP_HOST: z.string().min(1).default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_FROM: z.string().min(1).default("no-reply@autora.vn"),

  SWAGGER_ENABLED: booleanStringSchema.default(true),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().min(1).default("autora"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(rawEnv);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`[Config] Invalid environment variables:\n${details}`);
  }
  return parsed.data;
}
