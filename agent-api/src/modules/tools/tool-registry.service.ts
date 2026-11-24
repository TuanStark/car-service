import { Injectable } from "@nestjs/common";
import { z } from "zod";
import type {
  SiteManifest,
  TrustedActorContext,
} from "@/common/contracts/agent.contract";
import { stripSensitiveFields } from "@/common/security/pii-sanitizer";
import { AuditService } from "@/modules/audit/audit.service";
import { RbacService } from "@/modules/rbac/rbac.service";
import { MockAutoraConnector } from "@/modules/connectors/mock-autora.connector";

const SearchServicesArgs = z.object({
  query: z.string().max(120).optional(),
  categoryId: z.string().max(64).optional(),
  maxPriceVnd: z.number().int().positive().optional(),
});

const SearchGaragesArgs = z.object({
  query: z.string().max(120).optional(),
  city: z.enum(["hcm", "hn", "dn", "all"]).optional(),
  serviceCategory: z.string().max(64).optional(),
  minRating: z.number().min(1).max(5).optional(),
});

const CompareGaragesArgs = z.object({
  garageIds: z.array(z.string().max(80)).min(1).max(4),
});

const CheckAvailabilityArgs = z.object({
  garageId: z.string().max(80),
  date: z.string().max(20).default("2026-11-25"),
});

const PrepareBookingDraftArgs = z.object({
  garageId: z.string().max(80),
  serviceSlug: z.string().max(120),
  vehicleBrand: z.string().max(60).optional(),
  vehicleModel: z.string().max(80).optional(),
  preferredDate: z.string().max(20).optional(),
  preferredTime: z.string().max(10).optional(),
  notes: z.string().max(300).optional(),
});

export interface ToolExecutionResult {
  readonly ok: boolean;
  readonly toolName: string;
  readonly data?: unknown;
  readonly error?: string;
}

@Injectable()
export class ToolRegistryService {
  constructor(
    private readonly rbacService: RbacService,
    private readonly auditService: AuditService,
    private readonly connector: MockAutoraConnector
  ) {}

  async executeTool(params: {
    manifest: SiteManifest;
    actor: TrustedActorContext;
    sessionId: string;
    toolName: string;
    rawArgs: unknown;
  }): Promise<ToolExecutionResult> {
    const { manifest, actor, sessionId, toolName, rawArgs } = params;

    const permission = this.rbacService.canExecuteTool(
      manifest,
      actor,
      toolName
    );
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
      let result: unknown;

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
          result = await this.connector.checkAvailability(
            args.garageId,
            args.date
          );
          break;
        }
        case "prepare_booking_draft": {
          const args = PrepareBookingDraftArgs.parse(rawArgs ?? {});
          result = await this.connector.prepareBookingDraft(args);
          break;
        }
        case "get_my_vehicles": {
          // Server-enforced actor.userId; LLM cannot spoof userId
          result = await this.connector.getMyVehicles(actor.userId!);
          break;
        }
        case "get_my_orders": {
          result = await this.connector.getMyOrders(actor.userId!);
          break;
        }
        default:
          return {
            ok: false,
            toolName,
            error: `Unknown tool "${toolName}"`,
          };
      }

      const safeData = stripSensitiveFields(result);

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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tool execution failed";
      return {
        ok: false,
        toolName,
        error: msg,
      };
    }
  }
}
