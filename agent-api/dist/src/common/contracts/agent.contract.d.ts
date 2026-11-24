import { z } from "zod";
export declare const ActorRoleSchema: z.ZodEnum<["guest", "customer", "partner_staff"]>;
export type ActorRole = z.infer<typeof ActorRoleSchema>;
export interface TrustedActorContext {
    readonly tenantId: string;
    readonly role: ActorRole;
    readonly userId?: string;
    readonly garageId?: string;
}
export declare const PageContextSchema: z.ZodObject<{
    current_page: z.ZodDefault<z.ZodString>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    vehicle: z.ZodOptional<z.ZodObject<{
        brand: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        year: z.ZodOptional<z.ZodString>;
        mileage_km: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        brand?: string | undefined;
        model?: string | undefined;
        year?: string | undefined;
        mileage_km?: number | undefined;
    }, {
        brand?: string | undefined;
        model?: string | undefined;
        year?: string | undefined;
        mileage_km?: number | undefined;
    }>>;
    city: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    current_page: string;
    capabilities?: string[] | undefined;
    vehicle?: {
        brand?: string | undefined;
        model?: string | undefined;
        year?: string | undefined;
        mileage_km?: number | undefined;
    } | undefined;
    city?: string | undefined;
}, {
    current_page?: string | undefined;
    capabilities?: string[] | undefined;
    vehicle?: {
        brand?: string | undefined;
        model?: string | undefined;
        year?: string | undefined;
        mileage_km?: number | undefined;
    } | undefined;
    city?: string | undefined;
}>;
export type PageContext = z.infer<typeof PageContextSchema>;
export declare const AllowedActionTargetSchema: z.ZodEnum<["garage.search", "garage.show", "service.search", "service.show", "booking.start", "booking.fill_draft"]>;
export type AllowedActionTarget = z.infer<typeof AllowedActionTargetSchema>;
export declare const AgentActionSchema: z.ZodObject<{
    type: z.ZodEnum<["navigate", "prefill", "filter"]>;
    target: z.ZodEnum<["garage.search", "garage.show", "service.search", "service.show", "booking.start", "booking.fill_draft"]>;
    label: z.ZodString;
    requiresConfirmation: z.ZodDefault<z.ZodBoolean>;
    params: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>;
}, "strip", z.ZodTypeAny, {
    params: Record<string, string | number | boolean>;
    type: "filter" | "navigate" | "prefill";
    target: "garage.search" | "garage.show" | "service.search" | "service.show" | "booking.start" | "booking.fill_draft";
    label: string;
    requiresConfirmation: boolean;
}, {
    params: Record<string, string | number | boolean>;
    type: "filter" | "navigate" | "prefill";
    target: "garage.search" | "garage.show" | "service.search" | "service.show" | "booking.start" | "booking.fill_draft";
    label: string;
    requiresConfirmation?: boolean | undefined;
}>;
export type AgentAction = z.infer<typeof AgentActionSchema>;
export declare const UiCardSchema: z.ZodObject<{
    kind: z.ZodEnum<["service", "garage"]>;
    id: z.ZodString;
    slug: z.ZodString;
    title: z.ZodString;
    subtitle: z.ZodString;
    priceLabel: z.ZodOptional<z.ZodString>;
    rating: z.ZodOptional<z.ZodNumber>;
    badge: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["navigate", "prefill", "filter"]>;
        target: z.ZodEnum<["garage.search", "garage.show", "service.search", "service.show", "booking.start", "booking.fill_draft"]>;
        label: z.ZodString;
        requiresConfirmation: z.ZodDefault<z.ZodBoolean>;
        params: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>;
    }, "strip", z.ZodTypeAny, {
        params: Record<string, string | number | boolean>;
        type: "filter" | "navigate" | "prefill";
        target: "garage.search" | "garage.show" | "service.search" | "service.show" | "booking.start" | "booking.fill_draft";
        label: string;
        requiresConfirmation: boolean;
    }, {
        params: Record<string, string | number | boolean>;
        type: "filter" | "navigate" | "prefill";
        target: "garage.search" | "garage.show" | "service.search" | "service.show" | "booking.start" | "booking.fill_draft";
        label: string;
        requiresConfirmation?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    kind: "service" | "garage";
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    priceLabel?: string | undefined;
    rating?: number | undefined;
    badge?: string | undefined;
    image?: string | undefined;
    action?: {
        params: Record<string, string | number | boolean>;
        type: "filter" | "navigate" | "prefill";
        target: "garage.search" | "garage.show" | "service.search" | "service.show" | "booking.start" | "booking.fill_draft";
        label: string;
        requiresConfirmation: boolean;
    } | undefined;
}, {
    kind: "service" | "garage";
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    priceLabel?: string | undefined;
    rating?: number | undefined;
    badge?: string | undefined;
    image?: string | undefined;
    action?: {
        params: Record<string, string | number | boolean>;
        type: "filter" | "navigate" | "prefill";
        target: "garage.search" | "garage.show" | "service.search" | "service.show" | "booking.start" | "booking.fill_draft";
        label: string;
        requiresConfirmation?: boolean | undefined;
    } | undefined;
}>;
export type UiCard = z.infer<typeof UiCardSchema>;
export declare const CreateSessionDtoSchema: z.ZodObject<{
    tenantId: z.ZodDefault<z.ZodString>;
    actorRole: z.ZodOptional<z.ZodEnum<["guest", "customer", "partner_staff"]>>;
    actorUserId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    actorRole?: "guest" | "customer" | "partner_staff" | undefined;
    actorUserId?: string | undefined;
    metadata?: Record<string, string> | undefined;
}, {
    tenantId?: string | undefined;
    actorRole?: "guest" | "customer" | "partner_staff" | undefined;
    actorUserId?: string | undefined;
    metadata?: Record<string, string> | undefined;
}>;
export type CreateSessionDto = z.infer<typeof CreateSessionDtoSchema>;
export declare const SendMessageDtoSchema: z.ZodObject<{
    message: z.ZodString;
    context: z.ZodOptional<z.ZodObject<{
        current_page: z.ZodDefault<z.ZodString>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        vehicle: z.ZodOptional<z.ZodObject<{
            brand: z.ZodOptional<z.ZodString>;
            model: z.ZodOptional<z.ZodString>;
            year: z.ZodOptional<z.ZodString>;
            mileage_km: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            brand?: string | undefined;
            model?: string | undefined;
            year?: string | undefined;
            mileage_km?: number | undefined;
        }, {
            brand?: string | undefined;
            model?: string | undefined;
            year?: string | undefined;
            mileage_km?: number | undefined;
        }>>;
        city: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        current_page: string;
        capabilities?: string[] | undefined;
        vehicle?: {
            brand?: string | undefined;
            model?: string | undefined;
            year?: string | undefined;
            mileage_km?: number | undefined;
        } | undefined;
        city?: string | undefined;
    }, {
        current_page?: string | undefined;
        capabilities?: string[] | undefined;
        vehicle?: {
            brand?: string | undefined;
            model?: string | undefined;
            year?: string | undefined;
            mileage_km?: number | undefined;
        } | undefined;
        city?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    context?: {
        current_page: string;
        capabilities?: string[] | undefined;
        vehicle?: {
            brand?: string | undefined;
            model?: string | undefined;
            year?: string | undefined;
            mileage_km?: number | undefined;
        } | undefined;
        city?: string | undefined;
    } | undefined;
}, {
    message: string;
    context?: {
        current_page?: string | undefined;
        capabilities?: string[] | undefined;
        vehicle?: {
            brand?: string | undefined;
            model?: string | undefined;
            year?: string | undefined;
            mileage_km?: number | undefined;
        } | undefined;
        city?: string | undefined;
    } | undefined;
}>;
export type SendMessageDto = z.infer<typeof SendMessageDtoSchema>;
export interface SiteToolDeclaration {
    readonly name: string;
    readonly description: string;
    readonly allowedRoles: readonly ActorRole[];
}
export interface SiteNavigationEntry {
    readonly target: AllowedActionTarget;
    readonly description: string;
    readonly allowedParams: readonly string[];
    readonly requiresConfirmation?: boolean;
}
export interface SiteManifest {
    readonly tenantId: string;
    readonly brandName: string;
    readonly domain: string;
    readonly language: string;
    readonly persona: string;
    readonly allowedOrigins: readonly string[];
    readonly tools: readonly SiteToolDeclaration[];
    readonly navigationContract: readonly SiteNavigationEntry[];
}
export type SseEventPayload = {
    type: "session.ready";
    sessionId: string;
} | {
    type: "tool.status";
    tool: string;
    message: string;
} | {
    type: "message.delta";
    delta: string;
} | {
    type: "ui.cards";
    cards: readonly UiCard[];
} | {
    type: "action.proposed";
    actions: readonly AgentAction[];
} | {
    type: "message.completed";
    messageId: string;
    provider: string;
    latencyMs: number;
} | {
    type: "error";
    message: string;
};
