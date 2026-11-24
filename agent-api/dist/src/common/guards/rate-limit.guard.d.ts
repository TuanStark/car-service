import { type CanActivate, type ExecutionContext } from "@nestjs/common";
export declare class RateLimitGuard implements CanActivate {
    private readonly buckets;
    canActivate(context: ExecutionContext): boolean;
}
