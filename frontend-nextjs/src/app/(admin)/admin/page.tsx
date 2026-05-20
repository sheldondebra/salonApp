"use client";

import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminOverview } from "@/features/admin/admin-overview";
import { Permissions } from "@/lib/auth/permissions";

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Platform overview" description="SaaS metrics and recent salon workspaces">
      <RequirePlatformPermission permission={Permissions.tenants.view}>
        <AdminOverview />
      </RequirePlatformPermission>
    </AdminShell>
  );
}
