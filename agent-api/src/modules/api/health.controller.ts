import { Controller, Get } from "@nestjs/common";
import { loadEnv } from "@/common/config/env.config";
import { TenantRegistryService } from "@/modules/tenants/tenant-registry.service";

@Controller("health")
export class HealthController {
  constructor(private readonly tenantRegistry: TenantRegistryService) {}

  @Get()
  getHealth() {
    const env = loadEnv();
    return {
      status: "ok",
      service: "autora-agent-api",
      environment: env.NODE_ENV,
      llmStrategy: env.LLM_PROVIDER,
      tenants: this.tenantRegistry.listTenants(),
      timestamp: new Date().toISOString(),
    };
  }
}

