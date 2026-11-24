import { type ActorRole, type AgentAction, type SiteManifest, type TrustedActorContext } from "../../common/contracts/agent.contract";
export declare class RbacService {
    getReadableKnowledgeRoles(role: ActorRole): readonly ActorRole[];
    canExecuteTool(manifest: SiteManifest, actor: TrustedActorContext, toolName: string): {
        allowed: boolean;
        reason?: string;
    };
    validateProposedActions(manifest: SiteManifest, rawActions: unknown[], hostCapabilities?: readonly string[]): {
        valid: AgentAction[];
        rejected: Array<{
            raw: unknown;
            reason: string;
        }>;
    };
}
