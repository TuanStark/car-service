import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";
import type { IUnitOfWork } from "@core/domain/unit-of-work.interface";
import { type ExtendedPrismaClient, PrismaService } from "./prisma.service";

export type PrismaTransactionClient = Parameters<
  Parameters<ExtendedPrismaClient["$transaction"]>[0]
>[0];

export type PrismaQueryableClient = ExtendedPrismaClient | PrismaTransactionClient;

@Injectable()
export class PrismaUnitOfWorkService implements IUnitOfWork {
  private readonly txStorage = new AsyncLocalStorage<PrismaTransactionClient>();

  constructor(private readonly prisma: PrismaService) {}

  getClient(): PrismaQueryableClient {
    return this.txStorage.getStore() ?? this.prisma.client;
  }

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    const existingTx = this.txStorage.getStore();
    if (existingTx) {
      return work();
    }

    return this.prisma.client.$transaction(
      async (tx) => {
        return this.txStorage.run(tx, work);
      },
      {
        maxWait: 5_000,
        timeout: 15_000,
      }
    );
  }
}
