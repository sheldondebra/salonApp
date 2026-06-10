"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { PaymentRequestsView } from "@/features/payment-requests/payment-requests-view";
import { Permissions } from "@/lib/auth/permissions";

export default function FinancePaymentsPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <RequirePermission tenantSlug={params.tenantSlug} permission={[Permissions.finance.view, Permissions.payment_requests.view]}>
      <PaymentRequestsView tenantSlug={params.tenantSlug} />
    </RequirePermission>
  );
}
