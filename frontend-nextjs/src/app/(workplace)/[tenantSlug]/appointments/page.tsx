"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { WorkplaceShell } from "@/components/layout/workplace-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarDays } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { Permissions } from "@/lib/auth/permissions";

export default function AppointmentsPage({ params }: { params: { tenantSlug: string } }) {
  const { tenant } = useTenant(params.tenantSlug);

  return (
    <WorkplaceShell tenantSlug={params.tenantSlug} tenantName={tenant?.name ?? params.tenantSlug}>
      <RequirePermission tenantSlug={params.tenantSlug} permission={Permissions.bookings.view}>
      <EmptyState
        icon={CalendarDays}
        title="Appointments calendar"
        description="Full calendar view with drag-and-drop scheduling ships in the next sprint."
      />
      </RequirePermission>
    </WorkplaceShell>
  );
}
