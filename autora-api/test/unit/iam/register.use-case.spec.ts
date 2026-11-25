import { describe, expect, it, vi, beforeEach } from "vitest";
import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { IUnitOfWork } from "@core/domain/unit-of-work.interface";
import { EntityConflictException } from "@core/exceptions/domain.exception";
import { RegisterUseCase } from "@modules/iam/application/use-cases/register.use-case";
import type { TokenIssuerService } from "@modules/iam/application/services/token-issuer.service";
import { UserEntity } from "@modules/iam/domain/entities/user.entity";
import { USER_REGISTERED_EVENT } from "@modules/iam/domain/events/user-registered.event";
import type { IUserRepository } from "@modules/iam/domain/repositories/user.repository.interface";

describe("RegisterUseCase", () => {
  let useCase: RegisterUseCase;
  let userRepo: IUserRepository;
  let unitOfWork: IUnitOfWork;
  let tokenIssuer: TokenIssuerService;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    userRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(null),
      findByPhone: vi.fn().mockResolvedValue(null),
      createWithRoles: vi.fn().mockImplementation(async (u: UserEntity) => u),
      save: vi.fn(),
      updateLastLogin: vi.fn(),
      softDelete: vi.fn(),
    };

    unitOfWork = {
      runInTransaction: vi.fn().mockImplementation(async (work) => work()),
    };

    tokenIssuer = {
      hashOpaqueToken: vi.fn(),
      issueTokens: vi.fn().mockImplementation(async ({ user }: { user: UserEntity }) => ({
        refreshTokenId: "rt-1",
        response: {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
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

    eventEmitter = {
      emit: vi.fn(),
    } as unknown as EventEmitter2;

    useCase = new RegisterUseCase(userRepo, unitOfWork, tokenIssuer, eventEmitter);
  });

  it("registers a new customer inside a transaction and emits UserRegisteredEvent", async () => {
    const res = await useCase.execute({
      email: "Khoa.Nguyen@autora.vn",
      password: "Password123",
      fullName: "Nguyễn Đăng Khoa",
      phone: "0909688912",
    });

    expect(unitOfWork.runInTransaction).toHaveBeenCalledTimes(1);
    expect(userRepo.createWithRoles).toHaveBeenCalledTimes(1);
    expect(res.accessToken).toBe("mock-access-token");
    expect(res.user.email).toBe("khoa.nguyen@autora.vn");
    expect(res.user.roles).toEqual(["customer"]);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      USER_REGISTERED_EVENT,
      expect.objectContaining({
        email: "khoa.nguyen@autora.vn",
        fullName: "Nguyễn Đăng Khoa",
      })
    );
  });

  it("throws EntityConflictException when email already exists", async () => {
    const existing = UserEntity.createNew({
      email: "khoa.nguyen@autora.vn",
      passwordHash: "salt:hash",
      fullName: "Existing User",
    });
    vi.mocked(userRepo.findByEmail).mockResolvedValueOnce(existing);

    await expect(
      useCase.execute({
        email: "khoa.nguyen@autora.vn",
        password: "Password123",
        fullName: "New User",
      })
    ).rejects.toThrow(EntityConflictException);

    expect(userRepo.createWithRoles).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});
