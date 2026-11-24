import { describe, it, expect } from "vitest";
import { RbacService } from "@/modules/rbac/rbac.service";
import { RagService } from "@/modules/rag/rag.service";
import { AUTORA_TENANT_MANIFEST } from "@/modules/tenants/manifests/autora.manifest";
import {
  maskPhoneNumber,
  stripSensitiveFields,
} from "@/common/security/pii-sanitizer";

describe("RBAC & Security Guardrails", () => {
  const rbac = new RbacService();
  const rag = new RagService(rbac);

  it("denies personal tools for guest role", () => {
    const res = rbac.canExecuteTool(
      AUTORA_TENANT_MANIFEST,
      { tenantId: "autora-vn", role: "guest" },
      "get_my_vehicles"
    );
    expect(res.allowed).toBe(false);
  });

  it("allows personal tools for authenticated customer with server userId", () => {
    const res = rbac.canExecuteTool(
      AUTORA_TENANT_MANIFEST,
      { tenantId: "autora-vn", role: "customer", userId: "usr_khoa_01" },
      "get_my_vehicles"
    );
    expect(res.allowed).toBe(true);
  });

  it("rejects navigation actions outside tenant allowlist and strips unknown params", () => {
    const { valid, rejected } = rbac.validateProposedActions(
      AUTORA_TENANT_MANIFEST,
      [
        {
          type: "navigate",
          target: "garage.search",
          label: "Tìm gara Quận 7",
          params: { city: "hcm", district: "Quận 7", maliciousScript: "alert(1)" },
        },
        {
          type: "navigate",
          target: "admin.drop_database",
          label: "Hack",
          params: {},
        },
      ]
    );

    expect(valid).toHaveLength(1);
    expect(valid[0].params).toEqual({ city: "hcm", district: "Quận 7" });
    expect(rejected).toHaveLength(1);
  });

  it("enforces RBAC & tenant isolation on RAG knowledge retrieval", () => {
    const guestResults = rag.searchKnowledge({
      tenantId: "autora-vn",
      actorRole: "guest",
      query: "sổ bảo dưỡng thành viên ưu đãi",
    });
    expect(
      guestResults.some((r) => r.chunk.accessRole === "customer")
    ).toBe(false);

    const customerResults = rag.searchKnowledge({
      tenantId: "autora-vn",
      actorRole: "customer",
      query: "sổ bảo dưỡng thành viên ưu đãi",
    });
    expect(
      customerResults.some((r) => r.chunk.accessRole === "customer")
    ).toBe(true);

    const otherTenantResults = rag.searchKnowledge({
      tenantId: "other-tenant",
      actorRole: "customer",
      query: "thay dầu",
    });
    expect(otherTenantResults).toHaveLength(0);
  });

  it("sanitizes sensitive keys and masks Vietnamese phone numbers", () => {
    const cleaned = stripSensitiveFields({
      name: "Anh Khoa",
      passwordHash: "secret123",
      nested: { apiKey: "sk-123", city: "TP.HCM" },
    });
    expect(cleaned).toEqual({
      name: "Anh Khoa",
      nested: { city: "TP.HCM" },
    });
    expect(maskPhoneNumber("0909688912")).toBe("0909***912");
  });
});
