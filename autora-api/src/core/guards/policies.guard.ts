import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";
import {
  CHECK_POLICIES_KEY,
  type PolicyHandler,
} from "@core/decorators/check-policies.decorator";
import { CaslAbilityFactory } from "@modules/iam/application/casl/casl-ability.factory";

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handlers =
      this.reflector.getAllAndOverride<PolicyHandler[]>(CHECK_POLICIES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (handlers.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthenticatedUser }>();

    if (!request.user) {
      throw new ForbiddenException("Không xác định được danh tính người dùng.");
    }

    const ability = this.caslAbilityFactory.createForUser(request.user);
    const allowed = handlers.every((handler) => handler(ability));
    if (!allowed) {
      throw new ForbiddenException("Bạn không có quyền truy cập tài nguyên này.");
    }

    return true;
  }
}
