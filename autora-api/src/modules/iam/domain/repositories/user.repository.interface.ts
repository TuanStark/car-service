import type { IBaseRepository } from "@core/domain/repository.interface";
import type { UserEntity } from "../entities/user.entity";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");
export const REFRESH_TOKEN_REPOSITORY = Symbol("REFRESH_TOKEN_REPOSITORY");

export interface IUserRepository extends IBaseRepository<UserEntity> {
  findByEmail(email: string): Promise<UserEntity | null>;
  findByPhone(phone: string): Promise<UserEntity | null>;
  createWithRoles(user: UserEntity, roleCodes: readonly string[]): Promise<UserEntity>;
  updateLastLogin(userId: string, loggedInAt: Date): Promise<void>;
}

export interface RefreshTokenRecord {
  readonly id: string;
  readonly userId: string;
  readonly familyId: string;
  readonly tokenHash: string;
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly replacedBy: string | null;
}

export interface IRefreshTokenRepository {
  create(input: {
    id: string;
    userId: string;
    familyId: string;
    tokenHash: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
  }): Promise<RefreshTokenRecord>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  markRotated(id: string, replacedById: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
  revokeByTokenHash(tokenHash: string): Promise<void>;
}
