import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from "@casl/ability";
import { Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "@core/decorators/current-user.decorator";

export type Action = "manage" | "create" | "read" | "update" | "delete";

export type Subjects =
  | "all"
  | "Dashboard"
  | "User"
  | "Customer"
  | "Vehicle"
  | "Booking"
  | "Garage"
  | "ServiceProduct"
  | "AuditLog";

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AuthenticatedUser): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.roles.includes("admin")) {
      can("manage", "all");
      return build();
    }

    if (user.roles.includes("partner_staff")) {
      can("read", "ServiceProduct");
      can("manage", "Garage");
      can("read", "Booking");
      can("update", "Booking");
    }

    if (user.roles.includes("customer")) {
      can("read", "User");
      can("update", "User");
      can("manage", "Vehicle");
      can("create", "Booking");
      can("read", "Booking");
      can("read", "ServiceProduct");
      can("read", "Garage");
      cannot("delete", "ServiceProduct");
    }

    return build();
  }
}
