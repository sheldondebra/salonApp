"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplacePageShell } from "@/components/layout/workplace-page-shell";
import { PaymentRequestsView } from "@/features/payment-requests/payment-requests-view";
import { Permissions } from "@/lib/auth/permissions";

export default function PaymentRequestsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <WorkplacePageShell tenantSlug={params.tenantSlug} skeletonVariant="table">
      {({ tenant }) => (
        <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.payment_requests.view}>
          <PaymentRequestsView tenantSlug={params.tenantSlug} currency={tenant.currency ?? "GHS"} />
        </RequirePermission>
      )}
    </WorkplacePageShell>
  );
}
