import { generateUuidV7 } from "@core/utils/uuid.util";

export abstract class BaseDomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  protected constructor(public readonly eventName: string) {
    this.eventId = generateUuidV7();
    this.occurredAt = new Date();
  }
}
