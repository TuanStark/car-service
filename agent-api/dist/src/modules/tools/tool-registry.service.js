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
exports.ToolRegistryService = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const pii_sanitizer_1 = require("../../common/security/pii-sanitizer");
const audit_service_1 = require("../audit/audit.service");
const rbac_service_1 = require("../rbac/rbac.service");
const mock_autora_connector_1 = require("../connectors/mock-autora.connector");
const SearchServicesArgs = zod_1.z.object({
    query: zod_1.z.string().max(120).optional(),
    categoryId: zod_1.z.string().max(64).optional(),
    maxPriceVnd: zod_1.z.number().int().positive().optional(),
});
const SearchGaragesArgs = zod_1.z.object({
    query: zod_1.z.string().max(120).optional(),
    city: zod_1.z.enum(["hcm", "hn", "dn", "all"]).optional(),
    serviceCategory: zod_1.z.string().max(64).optional(),
    minRating: zod_1.z.number().min(1).max(5).optional(),
});
const CompareGaragesArgs = zod_1.z.object({
    garageIds: zod_1.z.array(zod_1.z.string().max(80)).min(1).max(4),
});
const CheckAvailabilityArgs = zod_1.z.object({
    garageId: zod_1.z.string().max(80),
    date: zod_1.z.string().max(20).default("2026-11-25"),
});
const PrepareBookingDraftArgs = zod_1.z.object({
    garageId: zod_1.z.string().max(80),
    serviceSlug: zod_1.z.string().max(120),
    vehicleBrand: zod_1.z.string().max(60).optional(),
    vehicleModel: zod_1.z.string().max(80).optional(),
    preferredDate: zod_1.z.string().max(20).optional(),
    preferredTime: zod_1.z.string().max(10).optional(),
    notes: zod_1.z.string().max(300).optional(),
});
let ToolRegistryService = class ToolRegistryService {
    rbacService;
    auditService;
    connector;
    constructor(rbacService, auditService, connector) {
        this.rbacService = rbacService;
        this.auditService = auditService;
        this.connector = connector;
    }
    async executeTool(params) {
        const { manifest, actor, sessionId, toolName, rawArgs } = params;
        const permission = this.rbacService.canExecuteTool(manifest, actor, toolName);
        if (!permission.allowed) {
            this.auditService.record({
                tenantId: actor.tenantId,
                sessionId,
                actorRole: actor.role,
                actorUserId: actor.userId,
                eventType: "tool.denied",
                toolName,
                allowed: false,
                reason: permission.reason,
            });
            return {
                ok: false,
                toolName,
                error: permission.reason,
            };
        }
        try {
            let result;
            switch (toolName) {
                case "search_services": {
                    const args = SearchServicesArgs.parse(rawArgs ?? {});
                    result = await this.connector.searchServices(args);
                    break;
                }
                case "search_garages": {
                    const args = SearchGaragesArgs.parse(rawArgs ?? {});
                    result = await this.connector.searchGarages(args);
                    break;
                }
                case "compare_garages": {
                    const args = CompareGaragesArgs.parse(rawArgs ?? {});
                    result = await this.connector.compareGarages(args.garageIds);
                    break;
                }
                case "check_availability": {
                    const args = CheckAvailabilityArgs.parse(rawArgs ?? {});
                    result = await this.connector.checkAvailability(args.garageId, args.date);
                    break;
                }
                case "prepare_booking_draft": {
                    const args = PrepareBookingDraftArgs.parse(rawArgs ?? {});
                    result = await this.connector.prepareBookingDraft(args);
                    break;
                }
                case "get_my_vehicles": {
                    result = await this.connector.getMyVehicles(actor.userId);
                    break;
                }
                case "get_my_orders": {
                    result = await this.connector.getMyOrders(actor.userId);
                    break;
                }
                default:
                    return {
                        ok: false,
                        toolName,
                        error: `Unknown tool "${toolName}"`,
                    };
            }
            const safeData = (0, pii_sanitizer_1.stripSensitiveFields)(result);
            this.auditService.record({
                tenantId: actor.tenantId,
                sessionId,
                actorRole: actor.role,
                actorUserId: actor.userId,
                eventType: "tool.executed",
                toolName,
                allowed: true,
            });
            return {
                ok: true,
                toolName,
                data: safeData,
            };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "Tool execution failed";
            return {
                ok: false,
                toolName,
                error: msg,
            };
        }
    }
};
exports.ToolRegistryService = ToolRegistryService;
exports.ToolRegistryService = ToolRegistryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rbac_service_1.RbacService,
        audit_service_1.AuditService,
        mock_autora_connector_1.MockAutoraConnector])
], ToolRegistryService);
//# sourceMappingURL=tool-registry.service.js.map