import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

const SOFT_DELETE_MODELS = new Set([
  "User",
  "ServiceCategory",
  "ServiceProduct",
  "Garage",
  "CustomerVehicle",
  "Coupon",
  "Booking",
  "Review",
]);

interface DynamicModelDelegate {
  update(args: { where: unknown; data: { deletedAt: Date } }): Promise<unknown>;
  updateMany(args: { where?: unknown; data: { deletedAt: Date } }): Promise<unknown>;
}

function toCamelCaseModel(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function withNotDeletedFilter(where: unknown): Record<string, unknown> {
  if (!where || typeof where !== "object") {
    return { deletedAt: null };
  }
  const record = where as Record<string, unknown>;
  if ("deletedAt" in record) {
    return record;
  }
  return { ...record, deletedAt: null };
}

export function createExtendedPrismaClient(
  baseClient: PrismaClient,
  slowQueryThresholdMs: number,
  logger: Logger
) {
  return baseClient.$extends({
    name: "autora-soft-delete-and-observability",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const startedAt = performance.now();
          const isSoftDeletable = Boolean(model && SOFT_DELETE_MODELS.has(model));

          let result: unknown;

          if (isSoftDeletable && model) {
            const mutableArgs = (args ?? {}) as Record<string, unknown>;

            if (
              operation === "findFirst" ||
              operation === "findFirstOrThrow" ||
              operation === "findMany" ||
              operation === "count" ||
              operation === "aggregate" ||
              operation === "groupBy"
            ) {
              mutableArgs.where = withNotDeletedFilter(mutableArgs.where);
              result = await query(mutableArgs);
            } else if (operation === "findUnique" || operation === "findUniqueOrThrow") {
              result = await query(mutableArgs);
              if (
                result &&
                typeof result === "object" &&
                "deletedAt" in result &&
                (result as { deletedAt: Date | null }).deletedAt !== null
              ) {
                if (operation === "findUniqueOrThrow") {
                  throw new Error(`${model} record has been soft-deleted`);
                }
                result = null;
              }
            } else if (operation === "delete") {
              const delegateMap = baseClient as unknown as Record<string, DynamicModelDelegate>;
              const delegate = delegateMap[toCamelCaseModel(model)];
              result = await delegate.update({
                where: mutableArgs.where,
                data: { deletedAt: new Date() },
              });
            } else if (operation === "deleteMany") {
              const delegateMap = baseClient as unknown as Record<string, DynamicModelDelegate>;
              const delegate = delegateMap[toCamelCaseModel(model)];
              result = await delegate.updateMany({
                where: mutableArgs.where,
                data: { deletedAt: new Date() },
              });
            } else {
              result = await query(mutableArgs);
            }
          } else {
            result = await query(args);
          }

          const durationMs = Math.round(performance.now() - startedAt);
          if (durationMs >= slowQueryThresholdMs) {
            logger.warn(
              JSON.stringify({
                event: "prisma.slow_query",
                model: model ?? "raw",
                operation,
                durationMs,
                thresholdMs: slowQueryThresholdMs,
              })
            );
          }

          return result;
        },
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly baseClient: PrismaClient;
  private readonly extendedClient: ExtendedPrismaClient;

  constructor(private readonly configService: ConfigService) {
    const dbUrl = this.configService.get<string>("database.url");
    const slowQueryMs = this.configService.get<number>("database.slowQueryMs") ?? 200;

    this.baseClient = new PrismaClient({
      datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
      log: [{ emit: "event", level: "error" }],
    });

    this.extendedClient = createExtendedPrismaClient(
      this.baseClient,
      slowQueryMs,
      this.logger
    );
  }

  get client(): ExtendedPrismaClient {
    return this.extendedClient;
  }

  get raw(): PrismaClient {
    return this.baseClient;
  }

  async onModuleInit(): Promise<void> {
    await this.baseClient.$connect();
    this.logger.log("Connected to PostgreSQL via Prisma with Soft-Delete & Slow-Query Extensions.");
  }

  async onModuleDestroy(): Promise<void> {
    await this.baseClient.$disconnect();
  }

  async ping(): Promise<boolean> {
    await this.baseClient.$queryRaw`SELECT 1`;
    return true;
  }
}
