import { Injectable } from "@nestjs/common";
import {
  type ActorRole,
  type AgentAction,
  AgentActionSchema,
  type SiteManifest,
  type TrustedActorContext,
  type UiWorkflowPlan,
  UiWorkflowPlanSchema,
  type UiWorkflowStep,
} from "@/common/contracts/agent.contract";

const TARGET_ID_REGEX = /^[a-zA-Z0-9._:-]+$/;

/**
 * Matches a concrete semantic UI targetId (e.g. "garage.filter.city.hcm")
 * against a registered manifest wildcard pattern (e.g. "garage.filter.city.*").
 */
export function matchTargetPattern(pattern: string, targetId: string): boolean {
  if (!TARGET_ID_REGEX.test(targetId)) {
    return false;
  }
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[a-zA-Z0-9_:-]+");
  return new RegExp(`^${escaped}$`).test(targetId);
}

const ROLE_HIERARCHY: Record<ActorRole, readonly ActorRole[]> = {
  guest: ["guest"],
  customer: ["guest", "customer"],
  partner_staff: ["guest", "customer", "partner_staff"],
};

@Injectable()
export class RbacService {
  /**
   * Returns all RAG document access roles visible to the current actor.
   */
  getReadableKnowledgeRoles(role: ActorRole): readonly ActorRole[] {
    return ROLE_HIERARCHY[role];
  }

  /**
   * Checks whether the current actor role is permitted by the tenant manifest to invoke a tool.
   */
  canExecuteTool(
    manifest: SiteManifest,
    actor: TrustedActorContext,
    toolName: string
  ): { allowed: boolean; reason?: string } {
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

    if (
      (toolName === "get_my_vehicles" || toolName === "get_my_orders") &&
      !actor.userId
    ) {
      return {
        allowed: false,
        reason: `Authenticated userId is required for personal tool "${toolName}".`,
      };
    }

    return { allowed: true };
  }

  /**
   * Filters and validates LLM-proposed actions against:
   * 1) Zod AgentActionSchema
   * 2) Tenant Navigation Contract allowlist
   * 3) Host page advertised capabilities (if provided)
   */
  validateProposedActions(
    manifest: SiteManifest,
    rawActions: unknown[],
    hostCapabilities?: readonly string[]
  ): { valid: AgentAction[]; rejected: Array<{ raw: unknown; reason: string }> } {
    const valid: AgentAction[] = [];
    const rejected: Array<{ raw: unknown; reason: string }> = [];

    for (const raw of rawActions) {
      const parsed = AgentActionSchema.safeParse(raw);
      if (!parsed.success) {
        rejected.push({
          raw,
          reason: "Invalid action schema",
        });
        continue;
      }

      const action = parsed.data;
      const contractEntry = manifest.navigationContract.find(
        (c) => c.target === action.target
      );
      if (!contractEntry) {
        rejected.push({
          raw,
          reason: `Action target "${action.target}" is outside tenant allowlist`,
        });
        continue;
      }

      if (
        hostCapabilities &&
        hostCapabilities.length > 0 &&
        !hostCapabilities.includes(action.target)
      ) {
        rejected.push({
          raw,
          reason: `Host website does not advertise capability "${action.target}"`,
        });
        continue;
      }

      // Filter params strictly to allowedParams declared in SiteManifest
      const sanitizedParams: Record<string, string | number | boolean> = {};
      for (const [k, v] of Object.entries(action.params)) {
        if (contractEntry.allowedParams.includes(k)) {
          sanitizedParams[k] = v;
        }
      }

      valid.push({
        ...action,
        params: sanitizedParams,
        requiresConfirmation:
          contractEntry.requiresConfirmation ?? action.requiresConfirmation,
      });
    }

    return { valid, rejected };
  }

  /**
   * Validates an LLM/synthesized UI Co-Browsing workflow plan against tenant uiTargets:
   * 1) Schema & step count limit (<= 12 steps)
   * 2) Every step targetId matches an allowlisted pattern in manifest.uiTargets
   * 3) Any target marked risk="confirm_only" strictly rejects click/type/select
   */
  validateWorkflowPlan(
    manifest: SiteManifest,
    rawPlan: unknown
  ): {
    plan: UiWorkflowPlan | null;
    rejected: Array<{ stepId?: string; targetId?: string; reason: string }>;
  } {
    const parsed = UiWorkflowPlanSchema.safeParse(rawPlan);
    if (!parsed.success) {
      return {
        plan: null,
        rejected: [{ reason: "Invalid workflow plan schema" }],
      };
    }

    const targets = manifest.uiTargets ?? [];
    if (targets.length === 0) {
      return {
        plan: null,
        rejected: [{ reason: "Tenant manifest declares no uiTargets" }],
      };
    }

    const validSteps: UiWorkflowStep[] = [];
    const rejected: Array<{ stepId?: string; targetId?: string; reason: string }> =
      [];

    for (const step of parsed.data.steps) {
      const matchedTarget = targets.find((decl) =>
        matchTargetPattern(decl.targetPattern, step.targetId)
      );

      if (!matchedTarget) {
        rejected.push({
          stepId: step.id,
          targetId: step.targetId,
          reason: `Target "${step.targetId}" is outside tenant uiTargets allowlist`,
        });
        continue;
      }

      const isMutatingAction =
        step.action === "click" ||
        step.action === "type" ||
        step.action === "select";

      if (matchedTarget.risk === "confirm_only" && isMutatingAction) {
        rejected.push({
          stepId: step.id,
          targetId: step.targetId,
          reason: `Target "${step.targetId}" is confirm_only; autonomous "${step.action}" is forbidden`,
        });
        continue;
      }

      if (
        (step.action === "click" ||
          step.action === "type" ||
          step.action === "select") &&
        !matchedTarget.interactions.includes(step.action)
      ) {
        rejected.push({
          stepId: step.id,
          targetId: step.targetId,
          reason: `Interaction "${step.action}" is not allowed for target "${step.targetId}"`,
        });
        continue;
      }

      validSteps.push({
        id: step.id,
        action: step.action,
        targetId: step.targetId,
        value: step.value,
        narration: step.narration,
        fallbackRoute: step.fallbackRoute,
        delayMs: step.delayMs,
      });
    }

    return {
      plan:
        validSteps.length > 0
          ? { title: parsed.data.title, steps: validSteps }
          : null,
      rejected,
    };
  }
}
