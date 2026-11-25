import React, { Suspense } from "react";
import { CustomersListView } from "@/features/customers/components/customers-list";
import { Card } from "@/shared/ui/card";
import { TableSkeleton } from "@/shared/ui/feedback";

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <TableSkeleton rows={6} cols={6} />
        </Card>
      }
    >
      <CustomersListView />
    </Suspense>
  );
}

