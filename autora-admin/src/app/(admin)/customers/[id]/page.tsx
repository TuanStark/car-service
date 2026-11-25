import React from "react";
import { CustomerDetailView } from "@/features/customers/components/customer-detail";

export default async function CustomerDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetailView customerId={id} />;
}

