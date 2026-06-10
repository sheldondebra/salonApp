"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WalletView } from "@/features/wallet/wallet-view";
import { Permissions } from "@/lib/auth/permissions";

export default function FinanceWalletPage({ params }: { params: { tenantSlug: string } }) {
  return (
    <RequirePermission tenantSlug={params.tenantSlug} permission={[Permissions.finance.view, Permissions.wallet.view]}>
      <WalletView tenantSlug={params.tenantSlug} />
    </RequirePermission>
  );
}
