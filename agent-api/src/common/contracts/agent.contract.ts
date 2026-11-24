import { z } from "zod";

export const ActorRoleSchema = z.enum(["guest", "customer", "partner_staff"]);
export type ActorRole = z.infer<typeof ActorRoleSchema>;

/**
 * Trusted server-side actor identity.
 * LLM can NEVER override userId, tenantId, or role.
 */
export interface TrustedActorContext {
  readonly tenantId: string;
  readonly role: ActorRole;
  readonly userId?: string;
  readonly garageId?: string;
}

export const PageContextSchema = z
  .object({
    current_page: z.string().max(200).default("/"),
    capabilities: z.array(z.string().max(80)).max(30).optional(),
    vehicle: z
      .object({
        brand: z.string().max(60).optional(),
        model: z.string().max(80).optional(),
        year: z.string().max(10).optional(),
        mileage_km: z.number().int().nonnegative().optional(),
      })
      .optional(),
    city: z.string().max(40).optional(),
  })
  .strict();

export type PageContext = z.infer<typeof PageContextSchema>;

/**
 * Strict Navigation Contract Allowlist.
 * Agent proposes structured actions; Host Website executes via NavigationAdapter.
 */
export const AllowedActionTargetSchema = z.enum([
  "garage.search",
  "garage.show",
  "service.search",
  "service.show",
  "booking.start",
  "booking.fill_draft",
]);
export type AllowedActionTarget = z.infer<typeof AllowedActionTargetSchema>;

export const AgentActionSchema = z.object({
  type: z.enum(["navigate", "prefill", "filter"]),
  target: AllowedActionTargetSchema,
  label: z.string().max(120),
  requiresConfirmation: z.boolean().default(false),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});
export type AgentAction = z.infer<typeof AgentActionSchema>;

export const UiCardSchema = z.object({
  kind: z.enum(["service", "garage"]),
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string(),
  priceLabel: z.string().optional(),
  rating: z.number().optional(),
  badge: z.string().optional(),
  image: z.string().optional(),
  action: AgentActionSchema.optional(),
});
export type UiCard = z.infer<typeof UiCardSchema>;

export const CreateSessionDtoSchema = z.object({
  tenantId: z.string().min(2).max(64).default("autora-vn"),
  actorRole: ActorRoleSchema.optional(),
  actorUserId: z.string().max(128).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});
export type CreateSessionDto = z.infer<typeof CreateSessionDtoSchema>;

export const SendMessageDtoSchema = z.object({
  message: z.string().trim().min(1, "Tin nhắn không được để trống").max(1500),
  context: PageContextSchema.optional(),
});
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

export type SseEventPayload =
  | { type: "session.ready"; sessionId: string }
  | { type: "tool.status"; tool: string; message: string }
  | { type: "message.delta"; delta: string }
  | { type: "ui.cards"; cards: readonly UiCard[] }
  | { type: "action.proposed"; actions: readonly AgentAction[] }
  | {
      type: "message.completed";
      messageId: string;
      provider: string;
      latencyMs: number;
    }
  | { type: "error"; message: string };
