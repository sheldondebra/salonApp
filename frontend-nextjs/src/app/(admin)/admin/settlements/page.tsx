"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSettlementsPage() {
  return (
    <AdminShell title="Settlements" description="Tenant wallet balances and payout readiness">
      <RequirePlatformPermission permission={[Permissions.office.finance, Permissions.billing.manage]}>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-accent" />
              Tenant settlements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Review salon wallet balances, activity history, and manual adjustments before payouts
              ship in a later batch.
            </p>
            <Button className="rounded-xl" asChild>
              <Link href="/admin/tenant-wallets">Open tenant wallets</Link>
            </Button>
          </CardContent>
        </Card>
      </RequirePlatformPermission>
    </AdminShell>
  );
}
