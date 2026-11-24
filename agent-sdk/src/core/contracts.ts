export type ActorRole = "guest" | "customer" | "partner_staff";

export type AllowedActionTarget =
  | "garage.search"
  | "garage.show"
  | "service.search"
  | "service.show"
  | "booking.start"
  | "booking.fill_draft";

export interface AgentAction {
  readonly type: "navigate" | "prefill" | "filter";
  readonly target: AllowedActionTarget;
  readonly label: string;
  readonly requiresConfirmation?: boolean;
  readonly params: Record<string, string | number | boolean>;
}

export interface UiCard {
  readonly kind: "service" | "garage";
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly subtitle: string;
  readonly priceLabel?: string;
  readonly rating?: number;
  readonly badge?: string;
  readonly image?: string;
  readonly action?: AgentAction;
}

export interface PageContext {
  readonly current_page: string;
  readonly capabilities?: readonly string[];
  readonly city?: string;
  readonly vehicle?: {
    readonly brand?: string;
    readonly model?: string;
    readonly year?: string;
    readonly mileage_km?: number;
  };
}

export interface NavigationAdapter {
  navigate(action: AgentAction): Promise<void>;
  getCurrentContext(): PageContext;
  getCapabilities(): readonly string[];
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

