import { Injectable, type NestMiddleware } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";
import type { IncomingMessage, ServerResponse } from "node:http";
import { generateUuidV7 } from "@core/utils/uuid.util";

export interface RequestContextStore {
  readonly requestId: string;
}

export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<RequestContextStore>();

  static run<T>(store: RequestContextStore, fn: () => T): T {
    return this.storage.run(store, fn);
  }

  static getRequestId(): string | undefined {
    return this.storage.getStore()?.requestId;
  }
}

export const CORRELATION_ID_HEADER = "x-request-id";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: IncomingMessage, res: ServerResponse, next: () => void): void {
    const incoming = req.headers[CORRELATION_ID_HEADER];
    const requestId =
      typeof incoming === "string" && incoming.trim().length > 0
        ? incoming.trim().slice(0, 128)
        : generateUuidV7();

    req.headers[CORRELATION_ID_HEADER] = requestId;
    res.setHeader(CORRELATION_ID_HEADER, requestId);

    RequestContext.run({ requestId }, () => {
      next();
    });
  }
}
