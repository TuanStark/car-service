"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const agent_contract_1 = require("../../common/contracts/agent.contract");
const ROLE_HIERARCHY = {
    guest: ["guest"],
    customer: ["guest", "customer"],
    partner_staff: ["guest", "customer", "partner_staff"],
};
let RbacService = class RbacService {
    getReadableKnowledgeRoles(role) {
        return ROLE_HIERARCHY[role];
    }
    canExecuteTool(manifest, actor, toolName) {
        const toolDecl = manifest.tools.find((t) => t.name === toolName);
        if (!toolDecl) {
            return {
                allowed: false,
                reason: `Tool "${toolName}" is not registered in tenant manifest "${manifest.tenantId}".`,
            };
        }
        if (!toolDecl.allowedRoles.includes(actor.role)) {
            return {
                allowed: false,
                reason: `Role "${actor.role}" is not authorized to execute tool "${toolName}".`,
            };
        }
        if ((toolName === "get_my_vehicles" || toolName === "get_my_orders") &&
            !actor.userId) {
            return {
                allowed: false,
                reason: `Authenticated userId is required for personal tool "${toolName}".`,
            };
        }
        return { allowed: true };
    }
    validateProposedActions(manifest, rawActions, hostCapabilities) {
        const valid = [];
        const rejected = [];
        for (const raw of rawActions) {
            const parsed = agent_contract_1.AgentActionSchema.safeParse(raw);
            if (!parsed.success) {
                rejected.push({
                    raw,
                    reason: "Invalid action schema",
                });
                continue;
            }
            const action = parsed.data;
            const contractEntry = manifest.navigationContract.find((c) => c.target === action.target);
            if (!contractEntry) {
                rejected.push({
                    raw,
                    reason: `Action target "${action.target}" is outside tenant allowlist`,
                });
                continue;
            }
            if (hostCapabilities &&
                hostCapabilities.length > 0 &&
                !hostCapabilities.includes(action.target)) {
                rejected.push({
                    raw,
                    reason: `Host website does not advertise capability "${action.target}"`,
                });
                continue;
            }
            const sanitizedParams = {};
            for (const [k, v] of Object.entries(action.params)) {
                if (contractEntry.allowedParams.includes(k)) {
                    sanitizedParams[k] = v;
                }
            }
            valid.push({
                ...action,
                params: sanitizedParams,
                requiresConfirmation: contractEntry.requiresConfirmation ?? action.requiresConfirmation,
            });
        }
        return { valid, rejected };
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)()
], RbacService);
//# sourceMappingURL=rbac.service.js.map