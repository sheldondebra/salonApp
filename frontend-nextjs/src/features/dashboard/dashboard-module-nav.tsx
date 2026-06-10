"use client";

import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ExternalLink,
  Package,
  Scissors,
  Settings,
  ShoppingCart,
  UserCircle,
  Users,
} from "lucide-react";
import { Permissions } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

type ModuleLink = {
  label: string;
  href: string;
  icon: typeof BarChart3;
  permission: string;
  external?: boolean;
};

type DashboardModuleNavProps = {
  tenantSlug: string;
  can: (permission: string | string[]) => boolean;
};

export function DashboardModuleNav({ tenantSlug, can }: DashboardModuleNavProps) {
  const base = `/${tenantSlug}`;

  const modules: ModuleLink[] = [
    { label: "Reports", href: `${base}/reports`, icon: BarChart3, permission: Permissions.analytics.view },
    { label: "Appointments", href: `${base}/appointments`, icon: CalendarDays, permission: Permissions.bookings.view },
    { label: "Services", href: `${base}/services`, icon: Scissors, permission: Permissions.services.view },
    { label: "Shop checkout", href: `${base}/pos`, icon: ShoppingCart, permission: Permissions.pos.view },
    { label: "Inventory", href: `${base}/inventory`, icon: Package, permission: Permissions.inventory.view },
    { label: "Clients", href: `${base}/clients`, icon: Users, permission: Permissions.clients.view },
    { label: "Staff", href: `${base}/staff`, icon: UserCircle, permission: Permissions.staff.view },
    { label: "Settings", href: `${base}/settings`, icon: Settings, permission: Permissions.settings.manage },
    { label: "Booking page", href: `${base}/book`, icon: ExternalLink, permission: Permissions.bookings.view, external: true },
  ];

  const visible = modules.filter((m) => can(m.permission));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((mod) => {
        const Icon = mod.icon;
        return (
          <Link
            key={mod.label}
            href={mod.href}
            target={mod.external ? "_blank" : undefined}
            rel={mod.external ? "noopener noreferrer" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium shadow-soft",
              "transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            {mod.label}
          </Link>
        );
      })}
    </div>
  );
}
