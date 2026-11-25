import React from "react";
import { GarageDetailView } from "@/features/garages/components/garage-detail";

export default async function GarageDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GarageDetailView garageId={id} />;
}

