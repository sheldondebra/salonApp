"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Boxes,
  CircleDollarSign,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Crown,
  DoorOpen,
  FileBarChart2,
  Gift,
  Globe2,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  MapPin,
  MessageSquare,
  Megaphone,
  Package,
  ShieldCheck,
  ShoppingCart,
  Scissors,
  Settings,
  Smartphone,
  Target,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAuthToken } from "@/lib/auth/session";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { AppShell } from "@/components/layout/app-shell";
import { WorkplaceMobileNav } from "@/components/layout/workplace-mobile-nav";
import { PageHeader } from "@/components/layout/page-header";
import type { ShellNavSection } from "@/components/layout/shell-types";

const navDefs = [
  { segment: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: Permissions.analytics.view },
  { segment: "reports", label: "Reports", icon: BarChart3, permission: Permissions.analytics.view },
  { segment: "appointments", label: "Appointments", icon: CalendarDays, permission: Permissions.bookings.view },
  { segment: "waitlist", label: "Waitlist", icon: ListOrdered, permission: Permissions.bookings.view },
  { segment: "payments", label: "Payments", icon: CreditCard, permission: Permissions.bookings.view },
  { segment: "payment-requests", label: "Payment requests", icon: Smartphone, permission: Permissions.payment_requests.view },
  { segment: "finance", label: "Finance", icon: CircleDollarSign, permission: Permissions.finance.view },
  { segment: "wallet", label: "Wallet", icon: Wallet, permission: Permissions.wallet.view },
  { segment: "services", label: "Services", icon: Scissors, permission: Permissions.services.view },
  { segment: "inventory", label: "Inventory", icon: Package, permission: Permissions.inventory.view },
  { segment: "memberships", label: "Memberships", icon: Crown, permission: Permissions.memberships.view },
  { segment: "packages", label: "Packages", icon: Gift, permission: Permissions.packages.view },
  { segment: "gift-cards", label: "Gift cards", icon: CreditCard, permission: Permissions.gift_cards.view },
  { segment: "bundles", label: "Bundles", icon: Boxes, permission: Permissions.inventory.view },
  { segment: "purchase-orders", label: "Purchase orders", icon: ClipboardList, permission: Permissions.inventory.view },
  { segment: "pos", label: "Shop checkout", icon: ShoppingCart, permission: Permissions.pos.view },
  { segment: "reviews", label: "Reviews", icon: MessageSquare, permission: Permissions.reviews.view },
  { segment: "kpi", label: "Goals", icon: Target, permission: Permissions.analytics.view },
  { segment: "analytics/occupancy", label: "Occupancy", icon: Activity, permission: Permissions.analytics.view },
  { segment: "analytics/retention", label: "Retention", icon: Users, permission: Permissions.analytics.view },
  { segment: "analytics/branch-comparison", label: "Branch comparison", icon: Activity, permission: Permissions.analytics.view },
  { segment: "report-builder", label: "Report builder", icon: FileBarChart2, permission: Permissions.reports.view },
  { segment: "scheduled-reports", label: "Scheduled reports", icon: FileBarChart2, permission: Permissions.reports.view },
  { segment: "staff", label: "Staff", icon: UserCircle, permission: Permissions.staff.view },
  { segment: "clients", label: "Clients", icon: Users, permission: Permissions.clients.view },
  { segment: "forms", label: "Forms", icon: ClipboardList, permission: Permissions.forms.view },
  { segment: "branches", label: "Branches", icon: MapPin, permission: [Permissions.services.view, Permissions.settings.manage] },
  { segment: "settings", label: "Settings", icon: Settings, permission: Permissions.settings.manage },
  { segment: "settings/integrations", label: "Integrations", icon: Globe2, permission: Permissions.settings.manage },
  { segment: "marketing/abandoned-bookings", label: "Abandoned bookings", icon: Megaphone, permission: Permissions.marketing.view },
  { segment: "marketing/rebooking", label: "Rebooking", icon: Megaphone, permission: Permissions.marketing.view },
  { segment: "marketing/social-links", label: "Social links", icon: Megaphone, permission: Permissions.marketing.view },
  { segment: "marketplace/profile", label: "Marketplace profile", icon: Globe2, permission: Permissions.marketplace.manage },
  { segment: "marketplace/featured", label: "Featured placements", icon: Globe2, permission: Permissions.marketplace.featured },
  { segment: "marketplace/commissions", label: "Marketplace commissions", icon: Globe2, permission: Permissions.marketplace.commissions },
  { segment: "staff/chair-rentals", label: "Chair rentals", icon: DoorOpen, permission: Permissions.staff.settings },
  { segment: "branches/groups", label: "Branch groups", icon: MapPin, permission: Permissions.settings.manage },
  { segment: "approvals", label: "Approvals", icon: ShieldCheck, permission: Permissions.approvals.view },
  { segment: "settings/white-label", label: "Your brand", icon: Settings, permission: Permissions.settings.manage },
];

const navSectionDefs: { id: string; label: string; segments: string[] }[] = [
  { id: "overview", label: "Overview", segments: ["dashboard", "reports"] },
  { id: "bookings", label: "Bookings", segments: ["appointments", "waitlist", "payments", "payment-requests"] },
  { id: "money", label: "Money", segments: ["finance", "wallet"] },
  {
    id: "retail",
    label: "Retail",
    segments: ["services", "inventory", "memberships", "packages", "gift-cards", "bundles", "purchase-orders", "pos"],
  },
  { id: "reviews", label: "Reviews", segments: ["reviews"] },
  { id: "analytics", label: "Analytics", segments: ["kpi", "analytics/occupancy", "analytics/retention", "analytics/branch-comparison", "report-builder", "scheduled-reports"] },
  { id: "people", label: "People", segments: ["staff", "clients", "forms"] },
  { id: "setup", label: "Setup", segments: ["branches", "settings"] },
  { id: "marketing", label: "Marketing", segments: ["marketing/abandoned-bookings", "marketing/rebooking", "marketing/social-links"] },
  { id: "marketplace", label: "Marketplace", segments: ["marketplace/profile", "marketplace/featured", "marketplace/commissions"] },
  { id: "enterprise", label: "Advanced", segments: ["settings/integrations", "staff/chair-rentals", "branches/groups", "approvals", "settings/white-label"] },
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
  const { can, loading: abilitiesLoading, permissions, error: abilitiesError } =
    useAbilities(tenantSlug);

  /** Show full salon nav while loading, or if permissions failed to load (API still enforces access). */
  const visibleNav =
    abilitiesLoading || permissions.length === 0
      ? navDefs
      : navDefs.filter((item) => can(item.permission));

  const navBySegment = new Map(visibleNav.map((item) => [item.segment, item]));

  const navSections: ShellNavSection[] = navSectionDefs
    .map((section) => ({
      id: section.id,
      label: section.label,
      items: section.segments
        .map((segment) => navBySegment.get(segment))
        .filter((item): item is (typeof navDefs)[number] => item != null)
        .map((item) => ({
          href: `${base}/${item.segment}`,
          label: item.label,
          icon: item.icon,
        })),
    }))
    .filter((section) => section.items.length > 0);

  const sidebarFooter = (
    <div className="space-y-2">
      <Link
        href={`${base}/book`}
        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary/20 to-accent/10 px-3 py-2.5 text-sm font-medium text-foreground ring-1 ring-primary/20 transition-all hover:from-primary/30 hover:to-accent/15"
      >
        View booking page
      </Link>
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
      navSections={navSections}
      sidebarFooter={sidebarFooter}
      mobileTitle={tenantName}
      mobileSubtitle={tagline ?? undefined}
      mainClassName="w-full"
      bottomNav={
        <Suspense fallback={null}>
          <WorkplaceMobileNav tenantSlug={tenantSlug} />
        </Suspense>
      }
      header={
        title ? <PageHeader title={title} description={description} /> : undefined
      }
    >
      {abilitiesError && !abilitiesLoading ? (
        <div className="mb-4 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Some menu items may be hidden because permissions could not load. Refresh the page or contact
          your account admin if sections are missing.
        </div>
      ) : null}
      {children}
    </AppShell>
  );
}
