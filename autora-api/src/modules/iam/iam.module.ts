import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PoliciesGuard } from "@core/guards/policies.guard";
import { CaslAbilityFactory } from "./application/casl/casl-ability.factory";
import { TokenIssuerService } from "./application/services/token-issuer.service";
import { LoginUseCase } from "./application/use-cases/login.use-case";
import { LogoutUseCase } from "./application/use-cases/logout.use-case";
import { RefreshTokenUseCase } from "./application/use-cases/refresh-token.use-case";
import { RegisterUseCase } from "./application/use-cases/register.use-case";
import {
  REFRESH_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from "./domain/repositories/user.repository.interface";
import { PrismaRefreshTokenRepository } from "./infrastructure/prisma-refresh-token.repository";
import { PrismaUserRepository } from "./infrastructure/prisma-user.repository";
import { AuthController } from "./presentation/auth.controller";

@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    CaslAbilityFactory,
    PoliciesGuard,
    TokenIssuerService,
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
  ],
  exports: [JwtModule, CaslAbilityFactory, PoliciesGuard, USER_REPOSITORY],
})
export class IamModule {}
