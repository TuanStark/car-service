import React, { Suspense } from "react";
import { GaragesListView } from "@/features/garages/components/garages-list";
import { Card } from "@/shared/ui/card";
import { TableSkeleton } from "@/shared/ui/feedback";

export default function GaragesPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <TableSkeleton rows={6} cols={6} />
        </Card>
      }
    >
      <GaragesListView />
    </Suspense>
  );
}

