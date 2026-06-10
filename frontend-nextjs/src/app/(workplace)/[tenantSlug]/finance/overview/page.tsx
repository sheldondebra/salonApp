"use client";

import { FinanceOverviewView } from "@/features/finance/finance-overview-view";

export default function FinanceOverviewPage({ params }: { params: { tenantSlug: string } }) {
  return <FinanceOverviewView tenantSlug={params.tenantSlug} />;
}
