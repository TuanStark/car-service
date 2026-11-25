import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { CheckPolicies } from "@core/decorators/check-policies.decorator";
import {
  type AuthenticatedUser,
  CurrentUser,
} from "@core/decorators/current-user.decorator";
import { Public } from "@core/decorators/public.decorator";
import { PoliciesGuard } from "@core/guards/policies.guard";
import {
  AuthTokensResponseDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from "../application/dto/auth.dto";
import { LoginUseCase } from "../application/use-cases/login.use-case";
import { LogoutUseCase } from "../application/use-cases/logout.use-case";
import { RefreshTokenUseCase } from "../application/use-cases/refresh-token.use-case";
import { RegisterUseCase } from "../application/use-cases/register.use-case";

const REFRESH_COOKIE_NAME = "autora_refresh_token";

@ApiTags("IAM & Auth")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly configService: ConfigService
  ) {}

  private setRefreshCookie(reply: FastifyReply, token: string): void {
    const secure = this.configService.get<boolean>("auth.cookieSecure") ?? false;
    const domain = this.configService.get<string>("auth.cookieDomain");

    reply.setCookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/api/v1/auth",
      domain: domain || undefined,
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  private clearRefreshCookie(reply: FastifyReply): void {
    reply.clearCookie(REFRESH_COOKIE_NAME, {
      path: "/api/v1/auth",
    });
  }

  private extractClientMeta(req: FastifyRequest): {
    userAgent?: string;
    ipAddress?: string;
  } {
    const ua = req.headers["user-agent"];
    return {
      userAgent: typeof ua === "string" ? ua.slice(0, 500) : undefined,
      ipAddress: req.ip,
    };
  }

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Đăng ký tài khoản chủ xe mới" })
  @ApiResponse({ status: 201, type: AuthTokensResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<AuthTokensResponseDto> {
    const result = await this.registerUseCase.execute(dto, this.extractClientMeta(req));
    this.setRefreshCookie(reply, result.refreshToken);
    return result;
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Đăng nhập bằng Email & Mật khẩu" })
  @ApiResponse({ status: 200, type: AuthTokensResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<AuthTokensResponseDto> {
    const result = await this.loginUseCase.execute(dto, this.extractClientMeta(req));
    this.setRefreshCookie(reply, result.refreshToken);
    return result;
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Làm mới Access Token (Refresh Token Rotation)" })
  @ApiResponse({ status: 200, type: AuthTokensResponseDto })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<AuthTokensResponseDto> {
    const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME] ?? "";
    const token = dto.refreshToken ?? cookieToken;
    const result = await this.refreshTokenUseCase.execute(
      token,
      this.extractClientMeta(req)
    );
    this.setRefreshCookie(reply, result.refreshToken);
    return result;
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Đăng xuất và thu hồi token hiện tại" })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RefreshTokenDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<{ loggedOut: true }> {
    const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const result = await this.logoutUseCase.execute(
      user,
      dto.refreshToken ?? cookieToken
    );
    this.clearRefreshCookie(reply);
    return result;
  }

  @Get("me")
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can("read", "User"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lấy thông tin tài khoản đang đăng nhập" })
  me(@CurrentUser() user: AuthenticatedUser): Omit<AuthenticatedUser, "jti" | "exp"> {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
    };
  }
}
