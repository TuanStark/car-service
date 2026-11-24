import { Injectable } from "@nestjs/common";
import {
  type ActorRole,
  type AgentAction,
  AgentActionSchema,
  type SiteManifest,
  type TrustedActorContext,
} from "@/common/contracts/agent.contract";

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
}

