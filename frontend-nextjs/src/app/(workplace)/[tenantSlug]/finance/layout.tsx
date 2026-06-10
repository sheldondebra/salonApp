"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { FinanceShell } from "@/features/finance/finance-shell";
import { Permissions } from "@/lib/auth/permissions";

export default function FinanceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Money"
      description="See revenue, take payments, and understand what you earned"
      skeletonVariant="dashboard"
    >
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.finance.view}>
          <FinanceShell tenantSlug={params.tenantSlug}>{children}</FinanceShell>
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
