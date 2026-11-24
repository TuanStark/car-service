import { TenantRegistryService } from "../tenants/tenant-registry.service";
export declare class HealthController {
    private readonly tenantRegistry;
    constructor(tenantRegistry: TenantRegistryService);
    getHealth(): {
        status: string;
        service: string;
        environment: "development" | "production" | "test";
        llmStrategy: "auto" | "openrouter" | "gemini" | "agy" | "mock";
        tenants: readonly string[];
        timestamp: string;
    };
}
