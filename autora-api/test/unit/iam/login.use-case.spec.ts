import { describe, expect, it, vi, beforeEach } from "vitest";
import type { IUnitOfWork } from "@core/domain/unit-of-work.interface";
import {
  ForbiddenDomainException,
  UnauthorizedDomainException,
} from "@core/exceptions/domain.exception";
import { hashPassword } from "@core/utils/password-hasher";
import type { TokenIssuerService } from "@modules/iam/application/services/token-issuer.service";
import { LoginUseCase } from "@modules/iam/application/use-cases/login.use-case";
import { UserEntity } from "@modules/iam/domain/entities/user.entity";
import type { IUserRepository } from "@modules/iam/domain/repositories/user.repository.interface";

describe("LoginUseCase", () => {
  let useCase: LoginUseCase;
  let userRepo: IUserRepository;
  let unitOfWork: IUnitOfWork;
  let tokenIssuer: TokenIssuerService;

  beforeEach(() => {
    userRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByPhone: vi.fn(),
      createWithRoles: vi.fn(),
      save: vi.fn(),
      updateLastLogin: vi.fn().mockResolvedValue(undefined),
      softDelete: vi.fn(),
    };

    unitOfWork = {
      runInTransaction: vi.fn().mockImplementation(async (work) => work()),
    };

    tokenIssuer = {
      issueTokens: vi.fn().mockImplementation(async ({ user }: { user: UserEntity }) => ({
        refreshTokenId: "rt-1",
        response: {
          accessToken: "jwt-access",
          refreshToken: "opaque-refresh",
          tokenType: "Bearer" as const,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            roles: user.roles,
          },
        },
      })),
    } as unknown as TokenIssuerService;

    useCase = new LoginUseCase(userRepo, unitOfWork, tokenIssuer);
  });

  it("authenticates valid credentials and updates lastLoginAt", async () => {
    const hash = await hashPassword("Autora@2026");
    const user = UserEntity.createNew({
      email: "khoa@autora.vn",
      passwordHash: hash,
      fullName: "Khoa",
    });
    vi.mocked(userRepo.findByEmail).mockResolvedValueOnce(user);

    const res = await useCase.execute({
      email: "khoa@autora.vn",
      password: "Autora@2026",
    });

    expect(res.accessToken).toBe("jwt-access");
    expect(userRepo.updateLastLogin).toHaveBeenCalledWith(user.id, expect.any(Date));
  });

  it("throws UnauthorizedDomainException on wrong password", async () => {
    const hash = await hashPassword("Autora@2026");
    const user = UserEntity.createNew({
      email: "khoa@autora.vn",
      passwordHash: hash,
      fullName: "Khoa",
    });
    vi.mocked(userRepo.findByEmail).mockResolvedValueOnce(user);

    await expect(
      useCase.execute({ email: "khoa@autora.vn", password: "WrongPassword" })
    ).rejects.toThrow(UnauthorizedDomainException);
  });

  it("throws ForbiddenDomainException when account is suspended", async () => {
    const hash = await hashPassword("Autora@2026");
    const suspendedUser = UserEntity.reconstitute("user-1", {
      email: "locked@autora.vn",
      phone: null,
      passwordHash: hash,
      fullName: "Locked",
      avatarUrl: null,
      status: "SUSPENDED",
      roles: ["customer"],
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    vi.mocked(userRepo.findByEmail).mockResolvedValueOnce(suspendedUser);

    await expect(
      useCase.execute({ email: "locked@autora.vn", password: "Autora@2026" })
    ).rejects.toThrow(ForbiddenDomainException);
  });
});
