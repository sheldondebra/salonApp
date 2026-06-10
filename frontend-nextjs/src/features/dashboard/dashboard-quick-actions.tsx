"use client";

import { CalendarDays, Scissors, ShoppingCart, Users } from "lucide-react";
import { Permissions } from "@/lib/auth/permissions";
import { DashboardQuickActionTile, DashboardQuickActionsRow } from "./dashboard-ui";

type DashboardQuickActionsProps = {
  tenantSlug: string;
  can: (permission: string | string[]) => boolean;
};

export function DashboardQuickActions({ tenantSlug, can }: DashboardQuickActionsProps) {
  const base = `/${tenantSlug}`;

  const actions = [
    {
      label: "Bookings",
      href: `${base}/appointments`,
      icon: CalendarDays,
      permission: Permissions.bookings.view,
    },
    {
      label: "Clients",
      href: `${base}/clients`,
      icon: Users,
      permission: Permissions.clients.view,
    },
    {
      label: "Staff",
      href: `${base}/staff`,
      icon: Scissors,
      permission: Permissions.staff.view,
    },
    {
      label: "Shop & POS",
      href: `${base}/pos`,
      icon: ShoppingCart,
      permission: Permissions.pos.view,
    },
  ];

  const visible = actions.filter((a) => can(a.permission));
  if (visible.length === 0) return null;

  return (
    <DashboardQuickActionsRow>
      {visible.map((action) => (
        <DashboardQuickActionTile
          key={action.label}
          icon={action.icon}
          label={action.label}
          href={action.href}
        />
      ))}
    </DashboardQuickActionsRow>
  );
}
