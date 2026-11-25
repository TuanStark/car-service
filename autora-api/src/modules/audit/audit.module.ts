import { Global, Module } from "@nestjs/common";
import { AdminAuditWriterService } from "./application/services/admin-audit-writer.service";
import { AuditEventListener } from "./application/listeners/audit-event.listener";
import { GetAdminAuditLogsUseCase } from "./application/use-cases/get-admin-audit-logs.use-case";
import { AdminAuditController } from "./presentation/admin-audit.controller";

@Global()
@Module({
  controllers: [AdminAuditController],
  providers: [
    AuditEventListener,
    AdminAuditWriterService,
    GetAdminAuditLogsUseCase,
  ],
  exports: [AdminAuditWriterService],
})
export class AuditModule {}
