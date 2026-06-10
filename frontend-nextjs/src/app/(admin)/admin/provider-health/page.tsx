"use client";

import Link from "next/link";
import { Server, Smartphone } from "lucide-react";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminProviderHealthPage() {
  return (
    <AdminShell title="Provider health" description="Payment and SMS integration status">
      <RequirePlatformPermission permission={[Permissions.office.settings, Permissions.billing.manage]}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-5 w-5 text-accent" />
                MTN MoMo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Platform collection credentials, token health checks, and sandbox status.</p>
              <Button variant="outline" className="rounded-xl" asChild>
                <Link href="/general-office/payment-gateways">Manage payment gateways</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-5 w-5 text-accent" />
                SMS reseller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>MNotify balance sync, package catalog, and delivery monitoring.</p>
              <Button variant="outline" className="rounded-xl" asChild>
                <Link href="/admin/sms">Open SMS Hub</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </RequirePlatformPermission>
    </AdminShell>
  );
}
