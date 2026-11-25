import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";
import { createHash, randomBytes } from "node:crypto";
import { generateUuidV7 } from "@core/utils/uuid.util";
import type { UserEntity } from "../../domain/entities/user.entity";
import {
  type IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from "../../domain/repositories/user.repository.interface";
import type { AuthTokensResponseDto } from "../dto/auth.dto";

export interface IssueTokensOptions {
  readonly user: UserEntity;
  readonly familyId?: string;
  readonly userAgent?: string;
  readonly ipAddress?: string;
}

@Injectable()
export class TokenIssuerService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository
  ) {}

  hashOpaqueToken(rawToken: string): string {
    return createHash("sha256").update(rawToken).digest("hex");
  }

  async issueTokens(options: IssueTokensOptions): Promise<{
    response: AuthTokensResponseDto;
    refreshTokenId: string;
  }> {
    const { user, userAgent, ipAddress } = options;
    const jti = generateUuidV7();

    const accessSecret = this.configService.get<string>("auth.jwtAccessSecret");
    const accessExpiresIn = (this.configService.get<string>("auth.jwtAccessExpiresIn") ??
      "15m") as JwtSignOptions["expiresIn"];

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: [...user.roles],
        jti,
      },
      {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }
    );

    const rawRefreshToken = randomBytes(48).toString("base64url");
    const refreshTokenId = generateUuidV7();
    const familyId = options.familyId ?? generateUuidV7();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepo.create({
      id: refreshTokenId,
      userId: user.id,
      familyId,
      tokenHash: this.hashOpaqueToken(rawRefreshToken),
      userAgent,
      ipAddress,
      expiresAt,
    });

    return {
      refreshTokenId,
      response: {
        accessToken,
        refreshToken: rawRefreshToken,
        tokenType: "Bearer",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          roles: user.roles,
        },
      },
    };
  }
}
