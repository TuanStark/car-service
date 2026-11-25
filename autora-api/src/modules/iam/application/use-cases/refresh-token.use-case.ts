import { Inject, Injectable } from "@nestjs/common";
import { type IUnitOfWork, UNIT_OF_WORK } from "@core/domain/unit-of-work.interface";
import { UnauthorizedDomainException } from "@core/exceptions/domain.exception";
import {
  type IRefreshTokenRepository,
  type IUserRepository,
  REFRESH_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from "../../domain/repositories/user.repository.interface";
import type { AuthTokensResponseDto } from "../dto/auth.dto";
import { TokenIssuerService } from "../services/token-issuer.service";

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    private readonly tokenIssuer: TokenIssuerService
  ) {}

  async execute(
    rawRefreshToken: string,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<AuthTokensResponseDto> {
    if (!rawRefreshToken) {
      throw new UnauthorizedDomainException("Thiếu Refresh Token.");
    }

    const tokenHash = this.tokenIssuer.hashOpaqueToken(rawRefreshToken);
    const stored = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!stored) {
      throw new UnauthorizedDomainException("Refresh Token không tồn tại.");
    }

    // Reuse detection: nếu token đã bị thu hồi trước đó -> thu hồi toàn bộ token family
    if (stored.revokedAt !== null) {
      await this.refreshTokenRepo.revokeFamily(stored.familyId);
      throw new UnauthorizedDomainException(
        "Phát hiện sử dụng lại Refresh Token đã thu hồi. Phiên đăng nhập đã bị khóa."
      );
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedDomainException("Refresh Token đã hết hạn.");
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user || !user.isActive()) {
      throw new UnauthorizedDomainException("Tài khoản không khả dụng.");
    }

    return this.unitOfWork.runInTransaction(async () => {
      const issued = await this.tokenIssuer.issueTokens({
        user,
        familyId: stored.familyId,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
      });

      await this.refreshTokenRepo.markRotated(stored.id, issued.refreshTokenId);
      return issued.response;
    });
  }
}
