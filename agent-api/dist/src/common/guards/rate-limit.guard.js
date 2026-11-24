"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const env_config_1 = require("../config/env.config");
let RateLimitGuard = class RateLimitGuard {
    buckets = new Map();
    canActivate(context) {
        const env = (0, env_config_1.loadEnv)();
        const req = context.switchToHttp().getRequest();
        const key = req.params?.sessionId ?? req.ip ?? "global";
        const now = Date.now();
        const windowStart = now - env.RATE_LIMIT_WINDOW_MS;
        const existing = this.buckets.get(key) ?? [];
        const recent = existing.filter((ts) => ts > windowStart);
        if (recent.length >= env.RATE_LIMIT_MAX_REQUESTS) {
            throw new common_1.HttpException("Bạn đang gửi yêu cầu quá nhanh. Vui lòng thử lại sau giây lát.", common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        recent.push(now);
        this.buckets.set(key, recent);
        return true;
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)()
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map