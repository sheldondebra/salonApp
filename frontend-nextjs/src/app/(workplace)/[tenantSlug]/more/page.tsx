"use client";

import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { WorkplaceMoreView } from "@/features/workplace/workplace-more-view";

export default function MorePage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell
      tenantSlug={params.tenantSlug}
      title="More"
      description="Additional salon tools and settings"
      skeletonVariant="default"
    >
      <WorkplaceMoreView tenantSlug={params.tenantSlug} />
    </WorkplacePageShell>
  );
}
