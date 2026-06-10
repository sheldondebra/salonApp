"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { RetentionDashboardView } from "@/features/analytics-insights/retention-dashboard-view";
import { Permissions } from "@/lib/auth/permissions";

export default function RetentionAnalyticsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Retention analytics"
      description="Repeat business, churn risk, and visit-return behavior"
    >
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.analytics.view}>
          <RetentionDashboardView tenantSlug={params.tenantSlug} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
