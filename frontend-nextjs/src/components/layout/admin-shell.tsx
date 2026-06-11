"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  Globe,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Scissors,
  Server,
  Settings,
  Store,
  Wallet,
} from "lucide-react";
import { SchedeluxLogo } from "@/components/branding/schedelux-logo";
import { Button } from "@/components/ui/button";
import { clearAuthToken } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import type { ShellNavItem, ShellNavSection } from "@/components/layout/shell-types";
import { AdminOfficeTopbar } from "@/features/admin/admin-office-topbar";
import { usePlatformAbilities } from "@/hooks/use-platform-abilities";
import { useSessionUser } from "@/hooks/use-session-user";
import { Permissions } from "@/lib/auth/permissions";

const navDefs: (ShellNavItem & { permission: string })[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
    permission: `${Permissions.office.dashboard}|${Permissions.tenants.view}`,
  },
  {
    href: "/admin/tenants",
    label: "Salons",
    icon: Building2,
    permission: `${Permissions.office.tenants}|${Permissions.tenants.view}`,
  },
  {
    href: "/admin/subscriptions",
    label: "Subscriptions",
    icon: ClipboardList,
    permission: `${Permissions.office.finance}|${Permissions.billing.manage}`,
  },
  {
    href: "/admin/payments",
    label: "Payments",
    icon: CreditCard,
    permission: `${Permissions.office.finance}|${Permissions.billing.manage}`,
  },
  {
    href: "/admin/settlements",
    label: "Payouts",
    icon: Wallet,
    permission: `${Permissions.office.finance}|${Permissions.billing.manage}`,
  },
  {
    href: "/general-office/payment-gateways",
    label: "Payment setup",
    icon: CreditCard,
    permission: `${Permissions.office.settings}|${Permissions.billing.manage}`,
  },
  {
    href: "/admin/sms",
    label: "SMS Hub",
    icon: MessageSquare,
    permission: `${Permissions.office.settings}|${Permissions.billing.manage}`,
  },
  {
    href: "/admin/domains",
    label: "Domains",
    icon: Globe,
    permission: `${Permissions.office.tenants}|${Permissions.tenants.view}`,
  },
  {
    href: "/admin/support",
    label: "Support",
    icon: LifeBuoy,
    permission: `${Permissions.office.support}|${Permissions.tenants.view}`,
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: BarChart3,
    permission: `${Permissions.office.operations}|${Permissions.tenants.view}`,
  },
  {
    href: "/admin/provider-health",
    label: "Connection status",
    icon: Server,
    permission: `${Permissions.office.settings}|${Permissions.billing.manage}`,
  },
  {
    href: "/admin/audit-logs",
    label: "Activity log",
    icon: Activity,
    permission: `${Permissions.office.settings}|${Permissions.billing.manage}`,
  },
  {
    href: "/admin/settings",
    label: "Platform settings",
    icon: Settings,
    permission: `${Permissions.office.settings}|${Permissions.billing.manage}`,
  },
];

const navSectionDefs: { id: string; label: string; hrefs: string[] }[] = [
  { id: "overview", label: "Overview", hrefs: ["/admin", "/admin/tenants"] },
  {
    id: "revenue",
    label: "Revenue",
    hrefs: ["/admin/subscriptions", "/admin/payments", "/admin/settlements", "/general-office/payment-gateways"],
  },
  {
    id: "operations",
    label: "Operations",
    hrefs: ["/admin/domains", "/admin/support", "/admin/reports", "/admin/provider-health", "/admin/audit-logs"],
  },
  { id: "system", label: "System", hrefs: ["/admin/sms", "/admin/settings"] },
];

function canNavItem(
  can: (permission: string | string[]) => boolean,
  permission: string
): boolean {
  const options = permission.split("|");
  return can(options);
}

export function AdminShell({
  title,
  description,
  children,
  alertCount = 0,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  alertCount?: number;
}) {
  const router = useRouter();
  const { can, loading } = usePlatformAbilities();
  const { user: sessionUser } = useSessionUser();

  const salonWorkspaceHref = useMemo(() => {
    const slug = sessionUser?.owned_tenant_slug;
    if (slug) return `/${slug}/dashboard`;
    return null;
  }, [sessionUser]);

  const salonNavItem = useMemo(
    () =>
      salonWorkspaceHref
        ? [
            {
              href: salonWorkspaceHref,
              label: "Salon workspace",
              icon: Store,
              exact: false,
            },
          ]
        : [],
    [salonWorkspaceHref]
  );

  const platformNav = loading
    ? navDefs
    : navDefs.filter((item) => canNavItem(can, item.permission));

  const navByHref = new Map(platformNav.map((item) => [item.href, item]));

  const navSections: ShellNavSection[] = [
    ...(salonNavItem.length
      ? [{ id: "workspace", label: "Workspace", items: salonNavItem }]
      : []),
    ...navSectionDefs
      .map((section) => ({
        id: section.id,
        label: section.label,
        items: section.hrefs
          .map((href) => navByHref.get(href))
          .filter((item): item is (typeof navDefs)[number] => item != null)
          .map(({ href, label, icon, exact }) => ({ href, label, icon, exact })),
      }))
      .filter((section) => section.items.length > 0),
  ];

  const signOutFooter = (
    <Button
      variant="ghost"
      className="h-10 w-full justify-start gap-2 rounded-xl text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
      onClick={() => {
        clearAuthToken();
        router.push("/login");
      }}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );

  return (
    <AppShell
      brand={{
        title: "Schedelux",
        subtitle: "Platform admin",
        href: "/admin",
        wideLogo: true,
        logo: <SchedeluxLogo variant="compact" href={null} className="h-9 w-full" />,
      }}
      navSections={navSections}
      sidebarFooter={signOutFooter}
      mainClassName="w-full"
      mobileTitle="Platform admin"
      mobileSubtitle="Manage salons and billing"
      toolbar={<AdminOfficeTopbar alertCount={alertCount} />}
      header={
        <PageHeader
          badge="Schedelux Platform"
          title={title}
          description={description}
        />
      }
    >
      {children}
    </AppShell>
  );
}
