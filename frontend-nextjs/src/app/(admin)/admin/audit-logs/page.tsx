"use client";

import { Activity } from "lucide-react";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

export default function AdminAuditLogsPage() {
  return (
    <AdminShell title="Audit logs" description="Immutable record of sensitive platform actions">
      <RequirePlatformPermission permission={[Permissions.office.settings, Permissions.billing.manage]}>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle>Audit timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Activity}
              title="Audit log viewer coming soon"
              description="Tenant suspensions, impersonation, wallet adjustments, and billing changes will appear here with actor, timestamp, and before/after snapshots."
            />
          </CardContent>
        </Card>
      </RequirePlatformPermission>
    </AdminShell>
  );
}
