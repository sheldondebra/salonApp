"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Scissors,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { clearAuthToken } from "@/lib/auth/session";
import { useRouter } from "next/navigation";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";

const navItems = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: Permissions.analytics.view },
  { href: "appointments", label: "Appointments", icon: CalendarDays, permission: Permissions.bookings.view },
  { href: "services", label: "Services", icon: Scissors, permission: Permissions.services.view },
  { href: "clients", label: "Clients", icon: Users, permission: Permissions.clients.view },
  { href: "settings", label: "Settings", icon: Settings, permission: Permissions.settings.manage },
];

type WorkplaceShellProps = {
  tenantSlug: string;
  tenantName: string;
  tagline?: string | null;
  children: React.ReactNode;
};

export function WorkplaceShell({ tenantSlug, tenantName, tagline, children }: WorkplaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/${tenantSlug}`;
  const { can, loading: abilitiesLoading } = useAbilities(tenantSlug);

  const visibleNav = abilitiesLoading
    ? navItems
    : navItems.filter((item) => can(item.permission));

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sidebar-foreground">{tenantName}</p>
            {tagline ? <p className="truncate text-xs text-muted-foreground">{tagline}</p> : null}
          </div>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 p-4">
          {visibleNav.map((item) => {
            const href = `${base}/${item.href}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-sidebar-border p-4">
          <Link
            href={`${base}/book`}
            className="flex items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
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
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
