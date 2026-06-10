"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { ReportBuilderView } from "@/features/report-builder/report-builder-view";
import { Permissions } from "@/lib/auth/permissions";

export default function ReportBuilderPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Report builder"
      description="Custom report definitions with live preview"
    >
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.reports.view}>
          <ReportBuilderView tenantSlug={params.tenantSlug} initialTab="builder" />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
