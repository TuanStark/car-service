"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
let AuditService = AuditService_1 = class AuditService {
    logger = new common_1.Logger(AuditService_1.name);
    records = [];
    seq = 1;
    record(event) {
        const entry = {
            ...event,
            id: `aud_${this.seq++}`,
            createdAt: new Date().toISOString(),
        };
        this.records.push(entry);
        if (this.records.length > 2000) {
            this.records.shift();
        }
        const logPayload = {
            auditId: entry.id,
            tenantId: entry.tenantId,
            sessionId: entry.sessionId,
            actorRole: entry.actorRole,
            eventType: entry.eventType,
            toolName: entry.toolName,
            actionTarget: entry.actionTarget,
            allowed: entry.allowed,
            provider: entry.provider,
            latencyMs: entry.latencyMs,
            reason: entry.reason,
        };
        if (!entry.allowed) {
            this.logger.warn(JSON.stringify(logPayload));
        }
        else {
            this.logger.log(JSON.stringify(logPayload));
        }
        return entry;
    }
    listBySession(sessionId) {
        return this.records.filter((r) => r.sessionId === sessionId);
    }
    listRecent(limit = 50) {
        return this.records.slice(-limit);
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)()
], AuditService);
//# sourceMappingURL=audit.service.js.map