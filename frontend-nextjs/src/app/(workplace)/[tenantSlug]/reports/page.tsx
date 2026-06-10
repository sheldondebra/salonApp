"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { TenantReportsView } from "@/features/reports/tenant-reports-view";
import { Permissions } from "@/lib/auth/permissions";

export default function ReportsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      description="Revenue, bookings, staff, and SMS analytics"
      skeletonVariant="dashboard"
    >
      {({ tenant }) => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.analytics.view}>
          <TenantReportsView tenantSlug={params.tenantSlug} currency={tenant.currency ?? "GHS"} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
