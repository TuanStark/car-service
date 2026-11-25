import React from "react";
import { BookingDetailView } from "@/features/bookings/components/booking-detail";

export default async function BookingDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookingDetailView bookingId={id} />;
}

