"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MapPin,
  Scissors,
  Settings,
  UserCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAuthToken } from "@/lib/auth/session";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import type { ShellNavItem } from "@/components/layout/shell-types";

const navDefs = [
  { segment: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: Permissions.analytics.view },
  { segment: "reports", label: "Reports", icon: BarChart3, permission: Permissions.analytics.view },
  { segment: "appointments", label: "Appointments", icon: CalendarDays, permission: Permissions.bookings.view },
  { segment: "branches", label: "Branches", icon: MapPin, permission: [Permissions.services.view, Permissions.settings.manage] },
  { segment: "services", label: "Services", icon: Scissors, permission: Permissions.services.view },
  { segment: "staff", label: "Team", icon: UserCircle, permission: Permissions.staff.view },
  { segment: "clients", label: "Clients", icon: Users, permission: Permissions.clients.view },
  { segment: "settings", label: "Settings", icon: Settings, permission: Permissions.settings.manage },
];

type WorkplaceShellProps = {
  tenantSlug: string;
  tenantName: string;
  tagline?: string | null;
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export function WorkplaceShell({
  tenantSlug,
  tenantName,
  tagline,
  title,
  description,
  children,
}: WorkplaceShellProps) {
  const router = useRouter();
  const base = `/${tenantSlug}`;
  const { can, loading: abilitiesLoading } = useAbilities(tenantSlug);

  const visibleNav = abilitiesLoading
    ? navDefs
    : navDefs.filter((item) => can(item.permission));

  const navItems: ShellNavItem[] = visibleNav.map((item) => ({
    href: `${base}/${item.segment}`,
    label: item.label,
    icon: item.icon,
  }));

  const sidebarFooter = (
    <div className="space-y-2">
      <Link
        href={`${base}/book`}
        className="flex items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
      >
        View booking page
      </Link>
      <Button
        variant="ghost"
        className="w-full justify-start gap-2"
        onClick={() => {
          clearAuthToken();
          router.push("/login");
        }}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );

  return (
    <AppShell
      brand={{
        title: tenantName,
        subtitle: tagline ?? undefined,
        href: `${base}/dashboard`,
        logo: <Scissors className="h-5 w-5" />,
      }}
      navItems={navItems}
      sidebarFooter={sidebarFooter}
      mobileTitle={tenantName}
      mobileSubtitle={tagline ?? undefined}
      mainClassName="mx-auto max-w-7xl"
      header={
        title ? <PageHeader title={title} description={description} /> : undefined
      }
    >
      {children}
    </AppShell>
  );
}
