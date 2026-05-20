"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
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
  Tag,
  Ticket,
  Users,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAuthToken } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import type { ShellNavItem } from "@/components/layout/shell-types";
import { usePlatformAbilities } from "@/hooks/use-platform-abilities";
import { Permissions } from "@/lib/auth/permissions";

const navDefs: (ShellNavItem & { permission: string })[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true, permission: Permissions.tenants.view },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, permission: Permissions.tenants.view },
  { href: "/admin/tenants", label: "Tenants", icon: Building2, permission: Permissions.tenants.view },
  { href: "/admin/users", label: "Users", icon: Users, permission: Permissions.tenants.view },
  { href: "/admin/onboarding", label: "Onboarding", icon: ClipboardList, permission: Permissions.tenants.view },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Ticket, permission: Permissions.billing.manage },
  { href: "/admin/plans", label: "Plans", icon: CreditCard, permission: Permissions.billing.manage },
  { href: "/admin/coupons", label: "Coupons", icon: Tag, permission: Permissions.billing.manage },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, permission: Permissions.billing.manage },
  { href: "/admin/payment-failures", label: "Payment failures", icon: AlertTriangle, permission: Permissions.billing.manage },
  { href: "/admin/unpaid", label: "Unpaid signups", icon: UserX, permission: Permissions.billing.manage },
  { href: "/admin/domains", label: "Domains", icon: Globe, permission: Permissions.tenants.view },
  { href: "/admin/sms", label: "SMS", icon: MessageSquare, permission: Permissions.billing.manage },
  { href: "/admin/support", label: "Support", icon: LifeBuoy, permission: Permissions.tenants.view },
];

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { can, loading } = usePlatformAbilities();

  const navItems = loading ? navDefs : navDefs.filter((item) => can(item.permission));

  const signOutFooter = (
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
  );

  return (
    <AppShell
      brand={{
        title: "SalonApp",
        subtitle: "General Office",
        href: "/admin",
        logo: <Scissors className="h-5 w-5" />,
      }}
      navItems={navItems}
      sidebarFooter={signOutFooter}
      mobileTitle="SalonApp Admin"
      mobileSubtitle="General Office"
      header={
        <PageHeader
          badge="Platform · General Office"
          title={title}
          description={description}
        />
      }
    >
      {children}
    </AppShell>
  );
}
