import { Module } from "@nestjs/common";
import { AuditEventListener } from "./application/listeners/audit-event.listener";

@Module({
  providers: [AuditEventListener],
})
export class AuditModule {}
