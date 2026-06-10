"use client";

import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPaymentGatewaysHub } from "@/features/payments/admin-payment-gateways-hub";
import { Permissions } from "@/lib/auth/permissions";

export default function GeneralOfficePaymentGatewaysPage() {
  return (
    <AdminShell
      title="Payment gateways"
      description="Platform payment providers — MTN MoMo, Paystack, and Flutterwave"
    >
      <RequirePlatformPermission permission={[Permissions.office.settings, Permissions.billing.manage]}>
        <AdminPaymentGatewaysHub />
      </RequirePlatformPermission>
    </AdminShell>
  );
}
