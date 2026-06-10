"use client";

import { FinanceExpensesView } from "@/features/finance/finance-expenses-view";

export default function FinanceExpensesPage({ params }: { params: { tenantSlug: string } }) {
  return <FinanceExpensesView tenantSlug={params.tenantSlug} />;
}
