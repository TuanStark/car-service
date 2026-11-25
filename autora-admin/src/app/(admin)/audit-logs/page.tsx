import React, { Suspense } from "react";
import { AuditLogsView } from "@/features/audit/components/audit-logs-view";
import { Card } from "@/shared/ui/card";
import { TableSkeleton } from "@/shared/ui/feedback";

export default function AuditLogsPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <TableSkeleton rows={8} cols={5} />
        </Card>
      }
    >
      <AuditLogsView />
    </Suspense>
  );
}

