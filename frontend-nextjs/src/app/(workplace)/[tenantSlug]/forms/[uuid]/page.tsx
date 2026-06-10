"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { FormBuilderView } from "@/features/forms/form-builder-view";
import { Permissions } from "@/lib/auth/permissions";

export default function FormBuilderPage({
  params,
}: {
  params: { tenantSlug: string; uuid: string };
}) {
  return (
    <WorkplacePageShell tenantSlug={params.tenantSlug} skeletonVariant="form">
      {() => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.forms.view}>
          <FormBuilderView tenantSlug={params.tenantSlug} formUuid={params.uuid} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
