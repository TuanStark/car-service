import "reflect-metadata";
import fastifyCookie from "@fastify/cookie";
import fastifyHelmet from "@fastify/helmet";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      trustProxy: true,
    }),
    { bufferLogs: true }
  );

  const pinoLogger = app.get(Logger);
  app.useLogger(pinoLogger);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("app.port") ?? 4000;
  const apiPrefix = configService.get<string>("app.apiPrefix") ?? "api";
  const corsOrigins = configService.get<string[]>("app.corsOrigins") ?? [
    "http://localhost:3000",
  ];
  const cookieSecret = configService.get<string>("auth.cookieSecret");
  const swaggerEnabled = configService.get<boolean>("app.swaggerEnabled") ?? false;

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: swaggerEnabled ? false : undefined,
  });

  await app.register(fastifyCookie, {
    secret: cookieSecret,
  });

  app.enableCors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id", "Idempotency-Key"],
    credentials: true,
  });

  app.setGlobalPrefix(apiPrefix, {
    exclude: ["health/live", "health/ready"],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
    })
  );

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("AUTORA Core API")
      .setDescription(
        "Enterprise Automotive Service E-Commerce & Multi-Vendor Garage Platform API"
      )
      .setVersion("1.0")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  app.enableShutdownHooks();

  await app.listen(port, "0.0.0.0");
  pinoLogger.log(
    `AUTORA API running at http://localhost:${port}/${apiPrefix}/v1`,
    "Bootstrap"
  );
}

void bootstrap();
