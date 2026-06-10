"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { SocialLinksView } from "@/features/marketing/social-links-view";
import { Permissions } from "@/lib/auth/permissions";

export default function SocialLinksPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Social links"
      description="Track social bio links and booking conversions"
    >
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.marketing.view}>
          <SocialLinksView tenantSlug={params.tenantSlug} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
