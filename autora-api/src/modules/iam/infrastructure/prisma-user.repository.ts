import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { BasePrismaRepository } from "@infra/prisma/base.prisma-repository";
import { PrismaUnitOfWorkService } from "@infra/prisma/prisma-unit-of-work.service";
import { UserEntity } from "../domain/entities/user.entity";
import type { IUserRepository } from "../domain/repositories/user.repository.interface";

type UserWithRoles = Prisma.UserGetPayload<{
  include: { userRoles: { include: { role: true } } };
}>;

@Injectable()
export class PrismaUserRepository
  extends BasePrismaRepository
  implements IUserRepository
{
  constructor(private readonly uow: PrismaUnitOfWorkService) {
    super();
  }

  private toDomain(record: UserWithRoles): UserEntity {
    return UserEntity.reconstitute(record.id, {
      email: record.email,
      phone: record.phone,
      passwordHash: record.passwordHash,
      fullName: record.fullName,
      avatarUrl: record.avatarUrl,
      status: record.status,
      roles: record.userRoles.map((ur) => ur.role.code),
      lastLoginAt: record.lastLoginAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const record = await this.uow.getClient().user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const record = await this.uow.getClient().user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { userRoles: { include: { role: true } } },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    const record = await this.uow.getClient().user.findUnique({
      where: { phone: phone.trim() },
      include: { userRoles: { include: { role: true } } },
    });
    return record ? this.toDomain(record) : null;
  }

  async createWithRoles(
    user: UserEntity,
    roleCodes: readonly string[]
  ): Promise<UserEntity> {
    const db = this.uow.getClient();
    const roles = await db.role.findMany({
      where: { code: { in: [...roleCodes] } },
    });

    const created = await db.user.create({
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        userRoles: {
          create: roles.map((role) => ({ roleId: role.id })),
        },
      },
      include: { userRoles: { include: { role: true } } },
    });

    return this.toDomain(created);
  }

  async save(user: UserEntity): Promise<UserEntity> {
    const updated = await this.uow.getClient().user.update({
      where: { id: user.id },
      data: {
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
      include: { userRoles: { include: { role: true } } },
    });
    return this.toDomain(updated);
  }

  async updateLastLogin(userId: string, loggedInAt: Date): Promise<void> {
    await this.uow.getClient().user.update({
      where: { id: userId },
      data: { lastLoginAt: loggedInAt },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.uow.getClient().user.delete({
      where: { id },
    });
  }
}
