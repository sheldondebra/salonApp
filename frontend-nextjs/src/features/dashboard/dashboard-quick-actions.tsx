"use client";

import Link from "next/link";
import { CalendarPlus, Scissors, UserPlus, Users } from "lucide-react";
import { Permissions } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

type QuickAction = {
  label: string;
  description: string;
  href: string;
  icon: typeof CalendarPlus;
  permission: string;
};

type DashboardQuickActionsProps = {
  tenantSlug: string;
  can: (permission: string | string[]) => boolean;
};

export function DashboardQuickActions({ tenantSlug, can }: DashboardQuickActionsProps) {
  const base = `/${tenantSlug}`;

  const actions: QuickAction[] = [
    {
      label: "Add booking",
      description: "Schedule an appointment",
      href: `${base}/appointments`,
      icon: CalendarPlus,
      permission: Permissions.bookings.create,
    },
    {
      label: "Add customer",
      description: "New client profile",
      href: `${base}/clients`,
      icon: UserPlus,
      permission: Permissions.clients.create,
    },
    {
      label: "Add staff",
      description: "Team member",
      href: `${base}/staff`,
      icon: Users,
      permission: Permissions.staff.create,
    },
    {
      label: "Add service",
      description: "Menu item",
      href: `${base}/services`,
      icon: Scissors,
      permission: Permissions.services.create,
    },
  ];

  const visible = actions.filter((a) => can(a.permission));
  if (visible.length === 0) return null;

  return (
    <div
      className={cn(
        "grid w-full gap-3",
        visible.length === 1 && "grid-cols-1",
        visible.length === 2 && "grid-cols-1 sm:grid-cols-2",
        visible.length === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        visible.length >= 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      )}
    >
      {visible.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            href={action.href}
            className={cn(
              "group flex h-full min-h-[4.5rem] items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft",
              "transition-colors hover:border-primary/30 hover:bg-primary/5"
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-foreground">{action.label}</span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {action.description}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
