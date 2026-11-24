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

export type UiWorkflowStepAction =
  | "click"
  | "type"
  | "select"
  | "highlight"
  | "wait_route"
  | "handoff_confirm";

export interface UiWorkflowStep {
  readonly id: string;
  readonly action: UiWorkflowStepAction;
  readonly targetId: string;
  readonly value?: string;
  readonly narration: string;
  readonly fallbackRoute?: string;
  readonly delayMs?: number;
}

export interface UiWorkflowPlan {
  readonly title: string;
  readonly steps: readonly UiWorkflowStep[];
}

export type WorkflowExecutionMode = "auto" | "step";

export type ChoreographerStatus =
  | "idle"
  | "running"
  | "paused"
  | "awaiting_next_step"
  | "awaiting_user_confirm"
  | "completed"
  | "aborted"
  | "error";

export interface ChoreographerRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

export interface ChoreographerState {
  readonly status: ChoreographerStatus;
  readonly mode: WorkflowExecutionMode;
  readonly plan: UiWorkflowPlan | null;
  readonly currentStepIndex: number;
  readonly currentStep: UiWorkflowStep | null;
  readonly cursorPos: { readonly x: number; readonly y: number } | null;
  readonly spotlightRect: ChoreographerRect | null;
  readonly isClicking: boolean;
  readonly errorMessage?: string;
}

export interface PageContext {
  readonly current_page: string;
  readonly capabilities?: readonly string[];
  readonly uiCapabilities?: readonly string[];
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
  navigateToRoute?(route: string): Promise<void>;
  getCurrentContext(): PageContext;
  getCapabilities(): readonly string[];
  getAllowedUiTargetPatterns?(): readonly string[];
}

export type SseEventPayload =
  | { type: "session.ready"; sessionId: string }
  | { type: "tool.status"; tool: string; message: string }
  | { type: "message.delta"; delta: string }
  | { type: "ui.cards"; cards: readonly UiCard[] }
  | { type: "action.proposed"; actions: readonly AgentAction[] }
  | { type: "workflow.plan"; plan: UiWorkflowPlan }
  | {
      type: "message.completed";
      messageId: string;
      provider: string;
      latencyMs: number;
    }
  | { type: "error"; message: string };

