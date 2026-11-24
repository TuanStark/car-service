import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { loadEnv } from "./common/config/env.config";

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false })
  );

  app.enableCors({
    origin: env.CORS_ORIGINS.split(",").map((s) => s.trim()),
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  });

  await app.listen(env.PORT, "0.0.0.0");
  console.log(
    `[agent-api] Running on http://localhost:${env.PORT} (env=${env.NODE_ENV}, llm=${env.LLM_PROVIDER})`
  );
}

bootstrap();

