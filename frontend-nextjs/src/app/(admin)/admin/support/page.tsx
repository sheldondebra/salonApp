"use client";

import { LifeBuoy } from "lucide-react";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminSupportPage() {
  return (
    <AdminShell title="Support" description="Customer support tickets (coming soon)">
      <RequirePlatformPermission permission={[Permissions.office.support, Permissions.tenants.view]}>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>Support tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={LifeBuoy}
              title="Support module not enabled"
              description="This area is reserved for ticket queues, SLA tracking, and agent assignments. Connect your support provider in a future release."
            />
          </CardContent>
        </Card>
      </RequirePlatformPermission>
    </AdminShell>
  );
}
