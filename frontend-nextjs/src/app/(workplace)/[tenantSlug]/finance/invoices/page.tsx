"use client";

import { FinanceInvoicesView } from "@/features/finance/finance-invoices-view";

export default function FinanceInvoicesPage({ params }: { params: { tenantSlug: string } }) {
  return <FinanceInvoicesView tenantSlug={params.tenantSlug} tenantName={params.tenantSlug} />;
}
