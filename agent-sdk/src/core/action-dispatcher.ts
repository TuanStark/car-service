import type { AgentAction, NavigationAdapter } from "./contracts";

const ALLOWED_TARGETS = new Set([
  "garage.search",
  "garage.show",
  "service.search",
  "service.show",
  "booking.start",
  "booking.fill_draft",
]);

export interface DispatchResult {
  readonly executed: boolean;
  readonly reason?: string;
}

/**
 * Validates that an AgentAction is permitted by both the SDK contract
 * and the Host Website's advertised capabilities before executing navigation.
 */
export class ActionDispatcher {
  constructor(private readonly adapter: NavigationAdapter) {}

  async dispatch(action: AgentAction): Promise<DispatchResult> {
    if (!ALLOWED_TARGETS.has(action.target)) {
      return {
        executed: false,
        reason: `Blocked unsupported action target: ${action.target}`,
      };
    }

    const capabilities = this.adapter.getCapabilities();
    if (capabilities.length > 0 && !capabilities.includes(action.target)) {
      return {
        executed: false,
        reason: `Host website does not support capability: ${action.target}`,
      };
    }

    await this.adapter.navigate(action);
    return { executed: true };
  }
}

