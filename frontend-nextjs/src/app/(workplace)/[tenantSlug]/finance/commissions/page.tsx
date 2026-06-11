"use client";

import { FinanceCommissionsView } from "@/features/finance/finance-commissions-view";
import { useTenant } from "@/hooks/use-tenant";

export default function FinanceCommissionsPage({ params }: { params: { tenantSlug: string } }) {
  const { tenant } = useTenant(params.tenantSlug);

  return (
    <FinanceCommissionsView
      tenantSlug={params.tenantSlug}
      currency={tenant?.currency ?? "GHS"}
    />
  );
}
