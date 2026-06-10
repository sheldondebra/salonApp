"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { ApprovalsInboxView } from "@/features/approvals/approvals-inbox-view";
import { Permissions } from "@/lib/auth/permissions";

export default function ApprovalsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Approvals"
      description="Central inbox for requests awaiting leadership review"
    >
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.approvals.view}>
          <ApprovalsInboxView tenantSlug={params.tenantSlug} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
