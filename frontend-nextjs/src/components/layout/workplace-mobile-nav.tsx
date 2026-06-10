"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Home,
  LayoutGrid,
  MoreHorizontal,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabDef = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
};

function buildTabs(base: string): TabDef[] {
  return [
    {
      href: `${base}/dashboard`,
      label: "Home",
      icon: Home,
      match: (p) => p === base || p === `${base}/dashboard`,
    },
    {
      href: `${base}/appointments?view=calendar`,
      label: "Calendar",
      icon: LayoutGrid,
      match: (p) => p.startsWith(`${base}/appointments`) && p.includes("view=calendar"),
    },
    {
      href: `${base}/appointments`,
      label: "Bookings",
      icon: CalendarDays,
      match: (p) =>
        p.startsWith(`${base}/appointments`) && !p.includes("view=calendar"),
    },
    {
      href: `${base}/clients`,
      label: "Customers",
      icon: Users,
      match: (p) => p.startsWith(`${base}/clients`),
    },
    {
      href: `${base}/more`,
      label: "More",
      icon: MoreHorizontal,
      match: (p) =>
        p.startsWith(`${base}/more`) ||
        p.startsWith(`${base}/staff`) ||
        p.startsWith(`${base}/pos`) ||
        p.startsWith(`${base}/services`) ||
        p.startsWith(`${base}/inventory`) ||
        p.startsWith(`${base}/memberships`) ||
        p.startsWith(`${base}/packages`) ||
        p.startsWith(`${base}/gift-cards`) ||
        p.startsWith(`${base}/bundles`) ||
        p.startsWith(`${base}/purchase-orders`) ||
        p.startsWith(`${base}/reviews`) ||
        p.startsWith(`${base}/kpi`) ||
        p.startsWith(`${base}/analytics`) ||
        p.startsWith(`${base}/report-builder`) ||
        p.startsWith(`${base}/scheduled-reports`) ||
        p.startsWith(`${base}/finance`) ||
        p.startsWith(`${base}/settings`),
    },
  ];
}

export function WorkplaceMobileNav({ tenantSlug }: { tenantSlug: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const base = `/${tenantSlug}`;
  const tabs = buildTabs(base);

  function isActive(tab: TabDef) {
    if (tab.label === "Calendar") {
      return pathname.startsWith(`${base}/appointments`) && view === "calendar";
    }
    if (tab.label === "Bookings") {
      return pathname.startsWith(`${base}/appointments`) && view !== "calendar";
    }
    return tab.match(pathname);
  }

  return (
    <nav
      className="flex items-stretch justify-around border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur"
      aria-label="Workplace navigation"
    >
      {tabs.map((tab) => {
        const active = isActive(tab);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-xs font-semibold transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
            <span className="truncate">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
