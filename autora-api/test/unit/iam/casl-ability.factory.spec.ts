import { describe, expect, it } from "vitest";
import { CaslAbilityFactory } from "@modules/iam/application/casl/casl-ability.factory";

describe("CaslAbilityFactory", () => {
  const factory = new CaslAbilityFactory();

  it("grants full management ability to admin role", () => {
    const ability = factory.createForUser({
      id: "admin-1",
      email: "admin@autora.vn",
      fullName: "Admin",
      roles: ["admin"],
      jti: "jti-1",
      exp: 9999999999,
    });

    expect(ability.can("manage", "all")).toBe(true);
    expect(ability.can("read", "Dashboard")).toBe(true);
    expect(ability.can("read", "Customer")).toBe(true);
    expect(ability.can("read", "AuditLog")).toBe(true);
  });

  it("denies admin privileges to customer and partner_staff", () => {
    const customerAbility = factory.createForUser({
      id: "cust-1",
      email: "customer@autora.vn",
      fullName: "Customer",
      roles: ["customer"],
      jti: "jti-2",
      exp: 9999999999,
    });

    const staffAbility = factory.createForUser({
      id: "staff-1",
      email: "staff@autora.vn",
      fullName: "Staff",
      roles: ["partner_staff"],
      jti: "jti-3",
      exp: 9999999999,
    });

    expect(customerAbility.can("manage", "all")).toBe(false);
    expect(customerAbility.can("read", "Dashboard")).toBe(false);
    expect(customerAbility.can("read", "AuditLog")).toBe(false);
    expect(staffAbility.can("manage", "all")).toBe(false);
    expect(staffAbility.can("read", "Dashboard")).toBe(false);
    expect(staffAbility.can("read", "Customer")).toBe(false);
  });
});

