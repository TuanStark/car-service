import { Inject, Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import { RedisService } from "@infra/redis/redis.service";
import {
  type IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from "../../domain/repositories/user.repository.interface";
import { TokenIssuerService } from "../services/token-issuer.service";

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly tokenIssuer: TokenIssuerService,
    private readonly redisService: RedisService
  ) {}

  async execute(
    currentUser: AuthenticatedUser,
    rawRefreshToken?: string
  ): Promise<{ loggedOut: true }> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const remainingTtl = Math.max(60, currentUser.exp - nowSeconds);

    await this.redisService.setFlag(`bl:jti:${currentUser.jti}`, "1", remainingTtl);

    if (rawRefreshToken) {
      const hash = this.tokenIssuer.hashOpaqueToken(rawRefreshToken);
      await this.refreshTokenRepo.revokeByTokenHash(hash);
    }

    return { loggedOut: true };
  }
}
