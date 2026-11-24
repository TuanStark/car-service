import { describe, it, expect } from "vitest";
import { RbacService, matchTargetPattern } from "@/modules/rbac/rbac.service";
import { AUTORA_TENANT_MANIFEST } from "@/modules/tenants/manifests/autora.manifest";

describe("Workflow Co-Browsing Guardrails", () => {
  const rbac = new RbacService();

  it("matches valid wildcard target patterns and rejects unsafe characters", () => {
    expect(matchTargetPattern("garage.filter.city.*", "garage.filter.city.hcm")).toBe(true);
    expect(
      matchTargetPattern("service.card.*.add_to_cart", "service.card.thay-dau-5w30.add_to_cart")
    ).toBe(true);
    expect(matchTargetPattern("garage.card.*", "garage.card.evil[onclick]")).toBe(false);
  });

  it("validates a multi-step Co-Browsing workflow and preserves safe steps", () => {
    const result = rbac.validateWorkflowPlan(AUTORA_TENANT_MANIFEST, {
      title: "Tìm gara Quận 7",
      steps: [
        {
          id: "s1",
          action: "click",
          targetId: "nav.garages",
          narration: "Mở trang Tìm gara",
        },
        {
          id: "s2",
          action: "type",
          targetId: "garage.filter.search",
          value: "Quận 7",
          narration: "Nhập Quận 7",
        },
        {
          id: "s3",
          action: "click",
          targetId: "garage.filter.city.hcm",
          narration: "Chọn TP. Hồ Chí Minh",
        },
      ],
    });

    expect(result.rejected).toHaveLength(0);
    expect(result.plan?.steps).toHaveLength(3);
  });

  it("blocks autonomous click on confirm_only targets while allowing handoff_confirm", () => {
    const result = rbac.validateWorkflowPlan(AUTORA_TENANT_MANIFEST, {
      title: "Đặt lịch",
      steps: [
        {
          id: "bad_click",
          action: "click",
          targetId: "checkout.submit_booking",
          narration: "Tự bấm xác nhận",
        },
        {
          id: "bad_unregistered",
          action: "click",
          targetId: "admin.delete_all",
          narration: "Ngoài allowlist",
        },
        {
          id: "safe_handoff",
          action: "handoff_confirm",
          targetId: "checkout.submit_booking",
          narration: "Bàn giao cho khách tự bấm xác nhận",
        },
      ],
    });

    expect(result.rejected).toHaveLength(2);
    expect(result.plan?.steps).toHaveLength(1);
    expect(result.plan?.steps[0].id).toBe("safe_handoff");
    expect(result.plan?.steps[0].action).toBe("handoff_confirm");
  });
});

