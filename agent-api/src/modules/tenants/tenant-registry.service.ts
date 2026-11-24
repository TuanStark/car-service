import { Injectable, NotFoundException } from "@nestjs/common";
import type { SiteManifest } from "@/common/contracts/agent.contract";
import { AUTORA_TENANT_MANIFEST } from "./manifests/autora.manifest";

@Injectable()
export class TenantRegistryService {
  private readonly manifests = new Map<string, SiteManifest>();

  constructor() {
    this.registerManifest(AUTORA_TENANT_MANIFEST);
  }

  registerManifest(manifest: SiteManifest): void {
    this.manifests.set(manifest.tenantId, manifest);
  }

  getManifest(tenantId: string): SiteManifest {
    const found = this.manifests.get(tenantId);
    if (!found) {
      throw new NotFoundException(
        `Tenant manifest "${tenantId}" is not registered.`
      );
    }
    return found;
  }

  listTenants(): readonly string[] {
    return Array.from(this.manifests.keys());
  }
}
