"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { OccupancyDashboardView } from "@/features/analytics-insights/occupancy-dashboard-view";
import { Permissions } from "@/lib/auth/permissions";

export default function OccupancyAnalyticsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Occupancy analytics"
      description="Capacity, utilization, and booked-hour coverage"
    >
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.analytics.view}>
          <OccupancyDashboardView tenantSlug={params.tenantSlug} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
