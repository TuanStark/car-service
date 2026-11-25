import React from "react";
import { ServiceDetailView } from "@/features/services/components/service-detail";

export default async function ServiceDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServiceDetailView serviceId={id} />;
}

