import { Injectable } from "@nestjs/common";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import type {
  IRefreshTokenRepository,
  RefreshTokenRecord,
} from "../domain/repositories/user.repository.interface";

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly uow: PrismaUnitOfWorkService) {}

  async create(input: {
    id: string;
    userId: string;
    familyId: string;
    tokenHash: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
  }): Promise<RefreshTokenRecord> {
    return this.uow.getClient().refreshToken.create({
      data: {
        id: input.id,
        userId: input.userId,
        familyId: input.familyId,
        tokenHash: input.tokenHash,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt: input.expiresAt,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.uow.getClient().refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async markRotated(id: string, replacedById: string): Promise<void> {
    await this.uow.getClient().refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        replacedBy: replacedById,
      },
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.uow.getClient().refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await this.uow.getClient().refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
