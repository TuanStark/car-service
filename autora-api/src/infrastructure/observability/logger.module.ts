import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import {
  CORRELATION_ID_HEADER,
  RequestContext,
} from "@core/middlewares/correlation-id.middleware";

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>("app.nodeEnv") ?? "development";
        const logLevel = configService.get<string>("app.logLevel") ?? "info";
        const isDev = nodeEnv === "development";

        return {
          pinoHttp: {
            level: logLevel,
            autoLogging: {
              ignore: (req) => req.url?.startsWith("/health") ?? false,
            },
            redact: {
              paths: [
                "req.headers.authorization",
                "req.headers.cookie",
                "res.headers['set-cookie']",
                "*.password",
                "*.refreshToken",
              ],
              censor: "[REDACTED]",
            },
            customProps: (req) => ({
              requestId:
                RequestContext.getRequestId() ??
                req.headers[CORRELATION_ID_HEADER],
            }),
            transport: isDev
              ? {
                  target: "pino-pretty",
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
                  },
                }
              : undefined,
          },
        };
      },
    }),
  ],
  exports: [LoggerModule],
})
export class AppLoggerModule {}
