"use client";

import { FinanceTipsView } from "@/features/finance/finance-tips-view";

export default function FinanceTipsPage({ params }: { params: { tenantSlug: string } }) {
  return <FinanceTipsView tenantSlug={params.tenantSlug} />;
}
