import type { ActorRole } from "../../common/contracts/agent.contract";
import { RbacService } from "../rbac/rbac.service";
export interface RagDocumentChunk {
    readonly id: string;
    readonly tenantId: string;
    readonly sourceId: string;
    readonly title: string;
    readonly content: string;
    readonly accessRole: ActorRole;
    readonly tags: readonly string[];
}
export interface RagSearchResult {
    readonly chunk: RagDocumentChunk;
    readonly score: number;
}
export declare class RagService {
    private readonly rbacService;
    private readonly chunks;
    constructor(rbacService: RbacService);
    ingestChunk(chunk: RagDocumentChunk): void;
    searchKnowledge(params: {
        tenantId: string;
        actorRole: ActorRole;
        query: string;
        limit?: number;
    }): readonly RagSearchResult[];
}
