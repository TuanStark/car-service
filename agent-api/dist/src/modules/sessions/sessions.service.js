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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const rxjs_1 = require("rxjs");
const audit_service_1 = require("../audit/audit.service");
const tenant_registry_service_1 = require("../tenants/tenant-registry.service");
let SessionsService = class SessionsService {
    tenantRegistry;
    auditService;
    sessions = new Map();
    streams = new Map();
    constructor(tenantRegistry, auditService) {
        this.tenantRegistry = tenantRegistry;
        this.auditService = auditService;
    }
    createSession(input) {
        this.tenantRegistry.getManifest(input.tenantId);
        const role = input.actorRole ?? "guest";
        const effectiveRole = role === "customer" && !input.actorUserId ? "guest" : role;
        const now = new Date();
        const expires = new Date(now.getTime() + 1000 * 60 * 60 * 4);
        const id = (0, node_crypto_1.randomUUID)();
        const record = {
            id,
            actor: {
                tenantId: input.tenantId,
                role: effectiveRole,
                userId: effectiveRole === "guest" ? undefined : input.actorUserId,
            },
            metadata: input.metadata,
            createdAt: now.toISOString(),
            expiresAt: expires.toISOString(),
            messages: [],
        };
        this.sessions.set(id, record);
        this.streams.set(id, new rxjs_1.Subject());
        this.auditService.record({
            tenantId: record.actor.tenantId,
            sessionId: id,
            actorRole: record.actor.role,
            actorUserId: record.actor.userId,
            eventType: "session.created",
            allowed: true,
        });
        return record;
    }
    getSession(sessionId) {
        const found = this.sessions.get(sessionId);
        if (!found) {
            throw new common_1.NotFoundException(`Session "${sessionId}" not found.`);
        }
        return found;
    }
    appendMessage(sessionId, msg) {
        const session = this.getSession(sessionId);
        session.messages.push(msg);
    }
    emitEvent(sessionId, payload) {
        const subject = this.streams.get(sessionId);
        if (subject) {
            subject.next(payload);
        }
    }
    getEventStream(sessionId) {
        this.getSession(sessionId);
        let subject = this.streams.get(sessionId);
        if (!subject) {
            subject = new rxjs_1.Subject();
            this.streams.set(sessionId, subject);
        }
        return subject.asObservable();
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_registry_service_1.TenantRegistryService,
        audit_service_1.AuditService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map