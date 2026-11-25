import { Inject, Injectable } from "@nestjs/common";
import { type IUnitOfWork, UNIT_OF_WORK } from "@core/domain/unit-of-work.interface";
import {
  ForbiddenDomainException,
  UnauthorizedDomainException,
} from "@core/exceptions/domain.exception";
import { verifyPassword } from "@core/utils/password-hasher";
import {
  type IUserRepository,
  USER_REPOSITORY,
} from "../../domain/repositories/user.repository.interface";
import type { AuthTokensResponseDto, LoginDto } from "../dto/auth.dto";
import { TokenIssuerService } from "../services/token-issuer.service";

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    private readonly tokenIssuer: TokenIssuerService
  ) {}

  async execute(
    dto: LoginDto,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<AuthTokensResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedDomainException("Email hoặc mật khẩu không chính xác.");
    }

    const passwordMatched = await verifyPassword(dto.password, user.passwordHash);
    if (!passwordMatched) {
      throw new UnauthorizedDomainException("Email hoặc mật khẩu không chính xác.");
    }

    if (!user.isActive()) {
      throw new ForbiddenDomainException(
        "Tài khoản đang bị tạm khóa hoặc chưa kích hoạt."
      );
    }

    return this.unitOfWork.runInTransaction(async () => {
      user.markLoggedIn();
      await this.userRepository.updateLastLogin(user.id, user.lastLoginAt!);
      const issued = await this.tokenIssuer.issueTokens({
        user,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
      });
      return issued.response;
    });
  }
}
