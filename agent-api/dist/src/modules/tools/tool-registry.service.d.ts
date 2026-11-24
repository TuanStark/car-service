import type { SiteManifest, TrustedActorContext } from "../../common/contracts/agent.contract";
import { AuditService } from "../audit/audit.service";
import { RbacService } from "../rbac/rbac.service";
import { MockAutoraConnector } from "../connectors/mock-autora.connector";
export interface ToolExecutionResult {
    readonly ok: boolean;
    readonly toolName: string;
    readonly data?: unknown;
    readonly error?: string;
}
export declare class ToolRegistryService {
    private readonly rbacService;
    private readonly auditService;
    private readonly connector;
    constructor(rbacService: RbacService, auditService: AuditService, connector: MockAutoraConnector);
    executeTool(params: {
        manifest: SiteManifest;
        actor: TrustedActorContext;
        sessionId: string;
        toolName: string;
        rawArgs: unknown;
    }): Promise<ToolExecutionResult>;
}
