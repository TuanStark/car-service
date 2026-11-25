import { registerAs } from "@nestjs/config";
import { validateEnv, type EnvConfig } from "./env.schema";

let cachedEnv: EnvConfig | null = null;

export function getValidatedEnv(): EnvConfig {
  if (!cachedEnv) {
    cachedEnv = validateEnv(process.env);
  }
  return cachedEnv;
}

export const appConfig = registerAs("app", () => {
  const env = getValidatedEnv();
  return {
    nodeEnv: env.NODE_ENV,
    name: env.APP_NAME,
    port: env.APP_PORT,
    url: env.APP_URL,
    apiPrefix: env.API_PREFIX,
    corsOrigins: env.CORS_ORIGINS,
    swaggerEnabled: env.SWAGGER_ENABLED,
    logLevel: env.LOG_LEVEL,
  };
});

export const databaseConfig = registerAs("database", () => {
  const env = getValidatedEnv();
  return {
    url: env.DATABASE_URL,
    slowQueryMs: env.DATABASE_SLOW_QUERY_MS,
  };
});

export const redisConfig = registerAs("redis", () => {
  const env = getValidatedEnv();
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  };
});

export const authConfig = registerAs("auth", () => {
  const env = getValidatedEnv();
  return {
    jwtAccessSecret: env.JWT_ACCESS_SECRET,
    jwtAccessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET,
    jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    cookieSecret: env.COOKIE_SECRET,
    cookieSecure: env.COOKIE_SECURE,
    cookieDomain: env.COOKIE_DOMAIN,
  };
});

export const throttleConfig = registerAs("throttle", () => {
  const env = getValidatedEnv();
  return {
    ttlMs: env.THROTTLE_TTL_MS,
    limit: env.THROTTLE_LIMIT,
    idempotencyTtlSeconds: env.IDEMPOTENCY_TTL_SECONDS,
  };
});

export const cloudinaryConfig = registerAs("cloudinary", () => {
  const env = getValidatedEnv();
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME?.trim() || "",
    apiKey: env.CLOUDINARY_API_KEY?.trim() || "",
    apiSecret: env.CLOUDINARY_API_SECRET?.trim() || "",
    uploadFolder: env.CLOUDINARY_UPLOAD_FOLDER.trim(),
  };
});
