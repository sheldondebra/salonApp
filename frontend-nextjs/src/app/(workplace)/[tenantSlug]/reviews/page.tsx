"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { ReviewsView } from "@/features/reviews/reviews-view";
import { Permissions } from "@/lib/auth/permissions";

export default function ReviewsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="Reviews"
      description="Automation, moderation, and complaint handling"
    >
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.reviews.view}>
          <ReviewsView tenantSlug={params.tenantSlug} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
