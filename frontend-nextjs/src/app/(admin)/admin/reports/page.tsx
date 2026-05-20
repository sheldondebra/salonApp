"use client";

import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminReportsView } from "@/features/reports/admin-reports-view";
import { Permissions } from "@/lib/auth/permissions";

export default function AdminReportsPage() {
  return (
    <AdminShell title="Reports" description="Platform-wide growth, MRR, and usage analytics">
      <RequirePlatformPermission permission={Permissions.tenants.view}>
        <AdminReportsView />
      </RequirePlatformPermission>
    </AdminShell>
  );
}
