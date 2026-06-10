"use client";

import { FinanceTransactionsView } from "@/features/finance/finance-transactions-view";

export default function FinanceTransactionsPage({ params }: { params: { tenantSlug: string } }) {
  return <FinanceTransactionsView tenantSlug={params.tenantSlug} />;
}
