"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const app_module_1 = require("./app.module");
const env_config_1 = require("./common/config/env.config");
async function bootstrap() {
    const env = (0, env_config_1.loadEnv)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({ logger: false }));
    app.enableCors({
        origin: env.CORS_ORIGINS.split(",").map((s) => s.trim()),
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true,
    });
    await app.listen(env.PORT, "0.0.0.0");
    console.log(`[agent-api] Running on http://localhost:${env.PORT} (env=${env.NODE_ENV}, llm=${env.LLM_PROVIDER})`);
}
bootstrap();
//# sourceMappingURL=main.js.map