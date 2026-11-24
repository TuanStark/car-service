import type { SiteManifest } from "../../common/contracts/agent.contract";
export declare class TenantRegistryService {
    private readonly manifests;
    constructor();
    registerManifest(manifest: SiteManifest): void;
    getManifest(tenantId: string): SiteManifest;
    listTenants(): readonly string[];
}
