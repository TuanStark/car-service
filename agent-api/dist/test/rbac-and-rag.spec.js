"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const rbac_service_1 = require("../src/modules/rbac/rbac.service");
const rag_service_1 = require("../src/modules/rag/rag.service");
const autora_manifest_1 = require("../src/modules/tenants/manifests/autora.manifest");
const pii_sanitizer_1 = require("../src/common/security/pii-sanitizer");
(0, vitest_1.describe)("RBAC & Security Guardrails", () => {
    const rbac = new rbac_service_1.RbacService();
    const rag = new rag_service_1.RagService(rbac);
    (0, vitest_1.it)("denies personal tools for guest role", () => {
        const res = rbac.canExecuteTool(autora_manifest_1.AUTORA_TENANT_MANIFEST, { tenantId: "autora-vn", role: "guest" }, "get_my_vehicles");
        (0, vitest_1.expect)(res.allowed).toBe(false);
    });
    (0, vitest_1.it)("allows personal tools for authenticated customer with server userId", () => {
        const res = rbac.canExecuteTool(autora_manifest_1.AUTORA_TENANT_MANIFEST, { tenantId: "autora-vn", role: "customer", userId: "usr_khoa_01" }, "get_my_vehicles");
        (0, vitest_1.expect)(res.allowed).toBe(true);
    });
    (0, vitest_1.it)("rejects navigation actions outside tenant allowlist and strips unknown params", () => {
        const { valid, rejected } = rbac.validateProposedActions(autora_manifest_1.AUTORA_TENANT_MANIFEST, [
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
        ]);
        (0, vitest_1.expect)(valid).toHaveLength(1);
        (0, vitest_1.expect)(valid[0].params).toEqual({ city: "hcm", district: "Quận 7" });
        (0, vitest_1.expect)(rejected).toHaveLength(1);
    });
    (0, vitest_1.it)("enforces RBAC & tenant isolation on RAG knowledge retrieval", () => {
        const guestResults = rag.searchKnowledge({
            tenantId: "autora-vn",
            actorRole: "guest",
            query: "sổ bảo dưỡng thành viên ưu đãi",
        });
        (0, vitest_1.expect)(guestResults.some((r) => r.chunk.accessRole === "customer")).toBe(false);
        const customerResults = rag.searchKnowledge({
            tenantId: "autora-vn",
            actorRole: "customer",
            query: "sổ bảo dưỡng thành viên ưu đãi",
        });
        (0, vitest_1.expect)(customerResults.some((r) => r.chunk.accessRole === "customer")).toBe(true);
        const otherTenantResults = rag.searchKnowledge({
            tenantId: "other-tenant",
            actorRole: "customer",
            query: "thay dầu",
        });
        (0, vitest_1.expect)(otherTenantResults).toHaveLength(0);
    });
    (0, vitest_1.it)("sanitizes sensitive keys and masks Vietnamese phone numbers", () => {
        const cleaned = (0, pii_sanitizer_1.stripSensitiveFields)({
            name: "Anh Khoa",
            passwordHash: "secret123",
            nested: { apiKey: "sk-123", city: "TP.HCM" },
        });
        (0, vitest_1.expect)(cleaned).toEqual({
            name: "Anh Khoa",
            nested: { city: "TP.HCM" },
        });
        (0, vitest_1.expect)((0, pii_sanitizer_1.maskPhoneNumber)("0909688912")).toBe("0909***912");
    });
});
//# sourceMappingURL=rbac-and-rag.spec.js.map