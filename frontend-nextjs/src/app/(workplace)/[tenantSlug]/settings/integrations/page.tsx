"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { IntegrationsSettingsView } from "@/features/settings/integrations-settings-view";
import { Permissions } from "@/lib/auth/permissions";

export default function IntegrationsSettingsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Integrations"
      description="Google Analytics and Meta Pixel tracking setup"
    >
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.settings.manage}>
          <IntegrationsSettingsView tenantSlug={params.tenantSlug} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
