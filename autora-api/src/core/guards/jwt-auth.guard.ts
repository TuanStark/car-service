import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { FastifyRequest } from "fastify";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import { IS_PUBLIC_KEY } from "@core/decorators/public.decorator";
import { RedisService } from "@infra/redis/redis.service";

interface JwtAccessPayload {
  readonly sub: string;
  readonly email: string;
  readonly fullName: string;
  readonly roles: readonly string[];
  readonly jti: string;
  readonly exp: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthenticatedUser }>();

    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException("Thiếu Bearer Access Token.");
    }

    let payload: JwtAccessPayload;
    try {
      const secret = this.configService.get<string>("auth.jwtAccessSecret");
      payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret,
      });
    } catch {
      throw new UnauthorizedException("Access Token không hợp lệ hoặc đã hết hạn.");
    }

    const isRevoked = await this.redisService.exists(`bl:jti:${payload.jti}`);
    if (isRevoked) {
      throw new UnauthorizedException("Phiên đăng nhập đã bị thu hồi.");
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      roles: payload.roles,
      jti: payload.jti,
      exp: payload.exp,
    };

    return true;
  }

  private extractBearerToken(request: FastifyRequest): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader || typeof authHeader !== "string") {
      return null;
    }
    const [scheme, token] = authHeader.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return null;
    }
    return token.trim();
  }
}
