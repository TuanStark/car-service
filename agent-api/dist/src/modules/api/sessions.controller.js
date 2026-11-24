"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const agent_contract_1 = require("../../common/contracts/agent.contract");
const rate_limit_guard_1 = require("../../common/guards/rate-limit.guard");
const sessions_service_1 = require("../sessions/sessions.service");
const agent_runtime_service_1 = require("../runtime/agent-runtime.service");
let SessionsController = class SessionsController {
    sessionsService;
    runtimeService;
    constructor(sessionsService, runtimeService) {
        this.sessionsService = sessionsService;
        this.runtimeService = runtimeService;
    }
    createSession(rawBody) {
        const parsed = agent_contract_1.CreateSessionDtoSchema.safeParse(rawBody ?? {});
        if (!parsed.success) {
            throw new common_1.BadRequestException(parsed.error.flatten());
        }
        const session = this.sessionsService.createSession(parsed.data);
        return {
            sessionId: session.id,
            tenantId: session.actor.tenantId,
            actorRole: session.actor.role,
            expiresAt: session.expiresAt,
        };
    }
    async sendMessage(sessionId, rawBody, req, reply) {
        const parsed = agent_contract_1.SendMessageDtoSchema.safeParse(rawBody);
        if (!parsed.success) {
            throw new common_1.BadRequestException(parsed.error.flatten());
        }
        const acceptHeader = req.headers.accept ?? "";
        const wantsSse = acceptHeader.includes("text/event-stream");
        if (wantsSse) {
            reply.raw.writeHead(200, {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            });
            const writeSse = (evt) => {
                reply.raw.write(`event: ${String(evt.type)}\n`);
                reply.raw.write(`data: ${JSON.stringify(evt)}\n\n`);
            };
            await this.runtimeService.processUserMessage({
                sessionId,
                userMessage: parsed.data.message,
                context: parsed.data.context,
                onStreamEvent: writeSse,
            });
            reply.raw.end();
            return;
        }
        return this.runtimeService.processUserMessage({
            sessionId,
            userMessage: parsed.data.message,
            context: parsed.data.context,
        });
    }
    streamEvents(sessionId) {
        return this.sessionsService.getEventStream(sessionId).pipe((0, rxjs_1.map)((payload) => ({
            type: payload.type,
            data: payload,
        })));
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SessionsController.prototype, "createSession", null);
__decorate([
    (0, common_1.Post)(":sessionId/messages"),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    __param(0, (0, common_1.Param)("sessionId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Sse)(":sessionId/events"),
    __param(0, (0, common_1.Param)("sessionId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Function)
], SessionsController.prototype, "streamEvents", null);
exports.SessionsController = SessionsController = __decorate([
    (0, common_1.Controller)("v1/sessions"),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService,
        agent_runtime_service_1.AgentRuntimeService])
], SessionsController);
//# sourceMappingURL=sessions.controller.js.map