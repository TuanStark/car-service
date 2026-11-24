"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendMessageDtoSchema = exports.CreateSessionDtoSchema = exports.UiCardSchema = exports.AgentActionSchema = exports.AllowedActionTargetSchema = exports.PageContextSchema = exports.ActorRoleSchema = void 0;
const zod_1 = require("zod");
exports.ActorRoleSchema = zod_1.z.enum(["guest", "customer", "partner_staff"]);
exports.PageContextSchema = zod_1.z
    .object({
    current_page: zod_1.z.string().max(200).default("/"),
    capabilities: zod_1.z.array(zod_1.z.string().max(80)).max(30).optional(),
    vehicle: zod_1.z
        .object({
        brand: zod_1.z.string().max(60).optional(),
        model: zod_1.z.string().max(80).optional(),
        year: zod_1.z.string().max(10).optional(),
        mileage_km: zod_1.z.number().int().nonnegative().optional(),
    })
        .optional(),
    city: zod_1.z.string().max(40).optional(),
})
    .strict();
exports.AllowedActionTargetSchema = zod_1.z.enum([
    "garage.search",
    "garage.show",
    "service.search",
    "service.show",
    "booking.start",
    "booking.fill_draft",
]);
exports.AgentActionSchema = zod_1.z.object({
    type: zod_1.z.enum(["navigate", "prefill", "filter"]),
    target: exports.AllowedActionTargetSchema,
    label: zod_1.z.string().max(120),
    requiresConfirmation: zod_1.z.boolean().default(false),
    params: zod_1.z.record(zod_1.z.string(), zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()])),
});
exports.UiCardSchema = zod_1.z.object({
    kind: zod_1.z.enum(["service", "garage"]),
    id: zod_1.z.string(),
    slug: zod_1.z.string(),
    title: zod_1.z.string(),
    subtitle: zod_1.z.string(),
    priceLabel: zod_1.z.string().optional(),
    rating: zod_1.z.number().optional(),
    badge: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
    action: exports.AgentActionSchema.optional(),
});
exports.CreateSessionDtoSchema = zod_1.z.object({
    tenantId: zod_1.z.string().min(2).max(64).default("autora-vn"),
    actorRole: exports.ActorRoleSchema.optional(),
    actorUserId: zod_1.z.string().max(128).optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
});
exports.SendMessageDtoSchema = zod_1.z.object({
    message: zod_1.z.string().trim().min(1, "Tin nhắn không được để trống").max(1500),
    context: exports.PageContextSchema.optional(),
});
//# sourceMappingURL=agent.contract.js.map