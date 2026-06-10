"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { WhiteLabelSettingsView } from "@/features/settings/white-label-settings-view";
import { Permissions } from "@/lib/auth/permissions";

export default function WhiteLabelSettingsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="White label"
      description="Configure custom domain, branding, and hosted experience settings"
    >
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.settings.manage}>
          <WhiteLabelSettingsView tenantSlug={params.tenantSlug} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
