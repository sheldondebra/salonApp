"use client";

import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminOverview } from "@/features/admin/admin-overview";
import { Permissions } from "@/lib/auth/permissions";

export default function AdminDashboardPage() {
  return (
    <AdminShell
      title="Command center"
      description="Executive overview of tenants, revenue, payments, and platform health"
    >
      <RequirePlatformPermission
        permission={[Permissions.office.dashboard, Permissions.tenants.view]}
      >
        <AdminOverview />
      </RequirePlatformPermission>
    </AdminShell>
  );
}
