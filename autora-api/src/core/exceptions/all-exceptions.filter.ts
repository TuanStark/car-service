import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  CORRELATION_ID_HEADER,
  RequestContext,
} from "@core/middlewares/correlation-id.middleware";
import { DomainException } from "./domain.exception";

export interface ProblemDetailsResponse {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance: string;
  readonly requestId: string;
  readonly timestamp: string;
  readonly errorCode?: string;
  readonly errors?: readonly string[];
}

const HTTP_TITLES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const reply = ctx.getResponse<FastifyReply>();

    const requestId =
      RequestContext.getRequestId() ??
      (typeof request.headers[CORRELATION_ID_HEADER] === "string"
        ? request.headers[CORRELATION_ID_HEADER]
        : "unknown");

    const problem = this.mapToProblemDetails(exception, request.url, requestId);

    if (problem.status >= 500) {
      this.logger.error(
        JSON.stringify({
          event: "http.unhandled_exception",
          requestId,
          path: request.url,
          method: request.method,
          status: problem.status,
          error: exception instanceof Error ? exception.message : String(exception),
          stack: exception instanceof Error ? exception.stack : undefined,
        })
      );
    }

    void reply
      .status(problem.status)
      .header("content-type", "application/problem+json; charset=utf-8")
      .header(CORRELATION_ID_HEADER, requestId)
      .send(problem);
  }

  private mapToProblemDetails(
    exception: unknown,
    instance: string,
    requestId: string
  ): ProblemDetailsResponse {
    const timestamp = new Date().toISOString();

    if (exception instanceof DomainException) {
      return {
        type: `https://api.autora.vn/problems/${exception.errorCode.toLowerCase()}`,
        title: HTTP_TITLES[exception.statusCode] ?? "Domain Error",
        status: exception.statusCode,
        detail: exception.message,
        instance,
        requestId,
        timestamp,
        errorCode: exception.errorCode,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const rawResponse = exception.getResponse();

      let detail = exception.message;
      let errors: readonly string[] | undefined;

      if (typeof rawResponse === "object" && rawResponse !== null) {
        const resObj = rawResponse as Record<string, unknown>;
        if (Array.isArray(resObj.message)) {
          errors = resObj.message.map(String);
          detail = "Dữ liệu đầu vào không hợp lệ.";
        } else if (typeof resObj.message === "string") {
          detail = resObj.message;
        }
      }

      return {
        type: `https://api.autora.vn/problems/http-${status}`,
        title: HTTP_TITLES[status] ?? exception.name,
        status,
        detail,
        instance,
        requestId,
        timestamp,
        ...(errors ? { errors } : {}),
      };
    }

    return {
      type: "https://api.autora.vn/problems/internal-server-error",
      title: "Internal Server Error",
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
      instance,
      requestId,
      timestamp,
    };
  }
}
