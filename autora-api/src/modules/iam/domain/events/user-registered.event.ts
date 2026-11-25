import { BaseDomainEvent } from "@core/domain/domain-event.base";

export const USER_REGISTERED_EVENT = "iam.user.registered";

export class UserRegisteredEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly fullName: string,
    public readonly roles: readonly string[]
  ) {
    super(USER_REGISTERED_EVENT);
  }
}
