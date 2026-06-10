"use client";

import Link from "next/link";
import {
  Activity,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Compass,
  Crown,
  CreditCard,
  DoorOpen,
  FileBarChart2,
  Gift,
  Globe2,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  Megaphone,
  Package,
  Scissors,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Target,
  UserCircle,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clearAuthToken } from "@/lib/auth/session";
import { useAbilities } from "@/hooks/use-abilities";
import { useSessionUser } from "@/hooks/use-session-user";
import { Permissions } from "@/lib/auth/permissions";

type MoreLink = {
  href: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  permission?: string | string[];
};

type WorkplaceMoreViewProps = {
  tenantSlug: string;
  tenantName?: string;
};

export function WorkplaceMoreView({ tenantSlug, tenantName }: WorkplaceMoreViewProps) {
  const base = `/${tenantSlug}`;
  const { can } = useAbilities(tenantSlug);
  const { user, loading: userLoading } = useSessionUser();

  const sections: { title: string; links: MoreLink[] }[] = [
    {
      title: "Daily tools",
      links: [
        {
          href: `${base}/staff`,
          label: "Staff",
          description: "Team profiles, schedules, and payroll",
          icon: UserCircle,
          permission: Permissions.staff.view,
        },
        {
          href: `${base}/pos`,
          label: "Shop checkout",
          description: "Retail checkout and sales",
          icon: ShoppingCart,
          permission: Permissions.pos.view,
        },
        {
          href: `${base}/services`,
          label: "Services",
          description: "Menu, pricing, and categories",
          icon: Scissors,
          permission: Permissions.services.view,
        },
        {
          href: `${base}/inventory`,
          label: "Inventory",
          description: "Products and stock levels",
          icon: Package,
          permission: Permissions.inventory.view,
        },
        {
          href: `${base}/memberships`,
          label: "Memberships",
          description: "Recurring plans and subscribers",
          icon: Crown,
          permission: Permissions.memberships.view,
        },
        {
          href: `${base}/packages`,
          label: "Packages",
          description: "Prepaid visits and redemptions",
          icon: Gift,
          permission: Permissions.packages.view,
        },
        {
          href: `${base}/gift-cards`,
          label: "Gift cards",
          description: "Stored value sales and balances",
          icon: CreditCard,
          permission: Permissions.gift_cards.view,
        },
        {
          href: `${base}/bundles`,
          label: "Bundles",
          description: "Retail combo offers",
          icon: Boxes,
          permission: Permissions.inventory.view,
        },
        {
          href: `${base}/purchase-orders`,
          label: "Purchase orders",
          description: "Supplier order builder and receiving",
          icon: Package,
          permission: Permissions.inventory.view,
        },
      ],
    },
    {
      title: "Finance & payments",
      links: [
        {
          href: `${base}/finance`,
          label: "Finance",
          description: "Revenue overview and reports",
          icon: CircleDollarSign,
          permission: Permissions.finance.view,
        },
        {
          href: `${base}/wallet`,
          label: "Wallet",
          description: "Schedelux wallet balance",
          icon: Wallet,
          permission: Permissions.wallet.view,
        },
        {
          href: `${base}/payment-requests`,
          label: "Payment requests",
          description: "Mobile money payment links",
          icon: Smartphone,
          permission: Permissions.payment_requests.view,
        },
        {
          href: `${base}/payments`,
          label: "Payments",
          description: "Booking payment history",
          icon: CreditCard,
          permission: Permissions.bookings.view,
        },
      ],
    },
    {
      title: "Salon setup",
      links: [
        {
          href: `${base}/branches`,
          label: "Branches",
          description: "Locations and addresses",
          icon: MapPin,
          permission: [Permissions.services.view, Permissions.settings.manage],
        },
        {
          href: `${base}/reports`,
          label: "Reports",
          description: "Analytics and exports",
          icon: BarChart3,
          permission: Permissions.analytics.view,
        },
        {
          href: `${base}/reviews`,
          label: "Reviews",
          description: "Feedback automation and moderation",
          icon: MessageSquare,
          permission: Permissions.reviews.view,
        },
        {
          href: `${base}/kpi`,
          label: "Goals",
          description: "Targets and live progress",
          icon: Target,
          permission: Permissions.analytics.view,
        },
        {
          href: `${base}/analytics/occupancy`,
          label: "Occupancy",
          description: "Capacity and utilization insights",
          icon: Activity,
          permission: Permissions.analytics.view,
        },
        {
          href: `${base}/analytics/branch-comparison`,
          label: "Branch comparison",
          description: "Compare multi-branch revenue and utilization",
          icon: Activity,
          permission: Permissions.analytics.view,
        },
        {
          href: `${base}/analytics/retention`,
          label: "Retention",
          description: "Repeat business and churn insight",
          icon: LayoutDashboard,
          permission: Permissions.analytics.view,
        },
        {
          href: `${base}/report-builder`,
          label: "Report builder",
          description: "Custom exports and scheduled reports",
          icon: FileBarChart2,
          permission: Permissions.analytics.export,
        },
        {
          href: `${base}/settings`,
          label: "Settings",
          description: "Branding, notifications, and billing",
          icon: Settings,
          permission: Permissions.settings.manage,
        },
      ],
    },
    {
      title: "Marketing",
      links: [
        {
          href: `${base}/marketing/abandoned-bookings`,
          label: "Abandoned bookings",
          description: "Recover unfinished bookings with nudges",
          icon: Megaphone,
          permission: Permissions.marketing.view,
        },
        {
          href: `${base}/marketing/rebooking`,
          label: "Rebooking",
          description: "Bring lapsed clients back automatically",
          icon: Megaphone,
          permission: Permissions.marketing.view,
        },
        {
          href: `${base}/marketing/social-links`,
          label: "Social links",
          description: "Track bio links and booking conversions",
          icon: Compass,
          permission: Permissions.marketing.view,
        },
      ],
    },
    {
      title: "Marketplace",
      links: [
        {
          href: `${base}/marketplace/profile`,
          label: "Marketplace profile",
          description: "Manage your public marketplace listing",
          icon: Globe2,
          permission: Permissions.marketplace.manage,
        },
        {
          href: `${base}/marketplace/featured`,
          label: "Featured placements",
          description: "Merchandise promoted marketplace slots",
          icon: Globe2,
          permission: Permissions.marketplace.featured,
        },
        {
          href: `${base}/marketplace/commissions`,
          label: "Marketplace commissions",
          description: "Track commissions and partner payouts",
          icon: Globe2,
          permission: Permissions.marketplace.commissions,
        },
      ],
    },
    {
      title: "Advanced",
      links: [
        {
          href: `${base}/settings/integrations`,
          label: "Integrations",
          description: "Google Analytics and Meta Pixel setup",
          icon: Globe2,
          permission: Permissions.settings.manage,
        },
        {
          href: `${base}/staff/chair-rentals`,
          label: "Chair rentals",
          description: "Manage booth and chair rental agreements",
          icon: DoorOpen,
          permission: Permissions.staff.settings,
        },
        {
          href: `${base}/branches/groups`,
          label: "Branch groups",
          description: "Organize regions and multi-branch clusters",
          icon: MapPin,
          permission: Permissions.settings.manage,
        },
        {
          href: `${base}/approvals`,
          label: "Approvals",
          description: "Review requests waiting on leadership",
          icon: ShieldCheck,
          permission: Permissions.approvals.view,
        },
        {
          href: `${base}/settings/white-label`,
          label: "Your brand",
          description: "Custom domain and branded login settings",
          icon: Settings,
          permission: Permissions.settings.manage,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-4">
      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {userLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <>
              <p className="font-semibold">{user?.name ?? "Signed in"}</p>
              {user?.email ? <p className="text-muted-foreground">{user.email}</p> : null}
              <p className="text-muted-foreground">
                {tenantName ?? tenantSlug} · salon workspace
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {sections.map((section) => {
        const links = section.links.filter((link) =>
          link.permission ? can(link.permission) : true
        );
        if (links.length === 0) return null;

        return (
          <section key={section.title} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex min-h-touch items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:bg-muted/40"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold">{link.label}</span>
                        <span className="block text-sm text-muted-foreground">{link.description}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <Button
        variant="outline"
        className="w-full rounded-xl"
        onClick={() => {
          clearAuthToken();
          window.location.href = "/login";
        }}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}
