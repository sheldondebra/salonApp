"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { BranchComparisonView } from "@/features/analytics-insights/branch-comparison-view";
import { Permissions } from "@/lib/auth/permissions";

export default function BranchComparisonPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Branch comparison"
      description="Compare multi-branch revenue, bookings, and utilization"
    >
      {({ tenant }) => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.analytics.view}>
          <BranchComparisonView tenantSlug={params.tenantSlug} currency={tenant.currency} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
