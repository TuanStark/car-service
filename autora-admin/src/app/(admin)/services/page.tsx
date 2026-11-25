import React, { Suspense } from "react";
import { ServicesListView } from "@/features/services/components/services-list";
import { Card } from "@/shared/ui/card";
import { TableSkeleton } from "@/shared/ui/feedback";

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <TableSkeleton rows={6} cols={6} />
        </Card>
      }
    >
      <ServicesListView />
    </Suspense>
  );
}

