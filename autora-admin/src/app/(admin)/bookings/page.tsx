import React, { Suspense } from "react";
import { BookingsListView } from "@/features/bookings/components/bookings-list";
import { Card } from "@/shared/ui/card";
import { TableSkeleton } from "@/shared/ui/feedback";

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <TableSkeleton rows={6} cols={6} />
        </Card>
      }
    >
      <BookingsListView />
    </Suspense>
  );
}

