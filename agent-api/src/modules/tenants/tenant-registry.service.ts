import { Injectable, NotFoundException, type OnModuleInit } from "@nestjs/common";
import type { SiteManifest } from "@/common/contracts/agent.contract";
import { PrismaService } from "@/common/prisma/prisma.service";
import { AUTORA_TENANT_MANIFEST } from "./manifests/autora.manifest";

@Injectable()
export class TenantRegistryService implements OnModuleInit {
  private readonly manifests = new Map<string, SiteManifest>();

  constructor(private readonly prisma?: PrismaService) {
    this.registerManifest(AUTORA_TENANT_MANIFEST);
  }

  async onModuleInit(): Promise<void> {
    if (!this.prisma?.isConnected) return;

    for (const manifest of this.manifests.values()) {
      await this.prisma.tenant.upsert({
        where: { id: manifest.tenantId },
        update: {
          name: manifest.brandName,
          domain: manifest.domain,
          allowedOrigins: [...manifest.allowedOrigins],
          manifestJson: manifest as unknown as object,
        },
        create: {
          id: manifest.tenantId,
          name: manifest.brandName,
          domain: manifest.domain,
          apiKeyHash: "dev_autora_key_hash",
          allowedOrigins: [...manifest.allowedOrigins],
          manifestJson: manifest as unknown as object,
        },
      });
    }
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
