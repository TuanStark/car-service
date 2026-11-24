"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
const zod_1 = require("zod");
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    PORT: zod_1.z.coerce.number().int().positive().default(4100),
    CORS_ORIGINS: zod_1.z.string().default("http://localhost:3000,http://localhost:3030"),
    DATABASE_URL: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string().optional(),
    STORAGE_DRIVER: zod_1.z.enum(["memory", "prisma"]).default("memory"),
    LLM_PROVIDER: zod_1.z
        .enum(["auto", "openrouter", "gemini", "agy", "mock"])
        .default("auto"),
    OPENROUTER_API_KEY: zod_1.z.string().optional(),
    OPENROUTER_MODEL: zod_1.z.string().default("google/gemini-2.5-flash"),
    OPENROUTER_BASE_URL: zod_1.z.string().default("https://openrouter.ai/api/v1"),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    GEMINI_MODEL: zod_1.z.string().default("gemini-2.5-flash"),
    AGY_CLI_ENABLED: zod_1.z
        .string()
        .default("true")
        .transform((v) => v !== "false"),
    AGY_CLI_BIN: zod_1.z.string().default("agy"),
    AGY_CLI_TIMEOUT_MS: zod_1.z.coerce.number().int().positive().default(25000),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.coerce.number().int().positive().default(30),
});
function loadEnv() {
    return EnvSchema.parse(process.env);
}
//# sourceMappingURL=env.config.js.map