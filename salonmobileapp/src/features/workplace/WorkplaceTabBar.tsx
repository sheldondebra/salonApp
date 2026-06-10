import { usePathname, useRouter } from "expo-router";
import { BottomTabBar, type BottomTabItem } from "@/components/BottomTabBar";
import { SideTabRail } from "@/components/SideTabRail";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

const WORKPLACE_TABS: BottomTabItem[] = [
  {
    href: "/workplace",
    label: "Home",
    icon: "home-outline",
    activeIcon: "home",
    match: (p) => p === "/workplace" || p === "/workplace/",
  },
  {
    href: "/workplace/schedule",
    label: "Calendar",
    icon: "calendar-outline",
    activeIcon: "calendar",
    match: (p) => p.startsWith("/workplace/schedule"),
  },
  {
    href: "/workplace/bookings",
    label: "Bookings",
    icon: "list-outline",
    activeIcon: "list",
    match: (p) => p.startsWith("/workplace/bookings"),
  },
  {
    href: "/workplace/clients",
    label: "Customers",
    icon: "people-outline",
    activeIcon: "people",
    match: (p) => p.startsWith("/workplace/clients"),
  },
  {
    href: "/workplace/payment-requests",
    label: "MoMo",
    icon: "phone-portrait-outline",
    activeIcon: "phone-portrait",
    phoneOnly: true,
    match: (p) =>
      p === "/workplace/payment-requests" ||
      p === "/workplace/payment-requests/",
  },
  {
    href: "/workplace/more",
    label: "More",
    icon: "ellipsis-horizontal-outline",
    activeIcon: "ellipsis-horizontal",
    match: (p) =>
      p.startsWith("/workplace/more") ||
      p.startsWith("/workplace/team") ||
      p.startsWith("/workplace/shop") ||
      p.startsWith("/workplace/finance") ||
      p.startsWith("/workplace/forms") ||
      p.startsWith("/workplace/waitlist") ||
      p.startsWith("/workplace/wallet") ||
      p.startsWith("/workplace/payment-settings") ||
      p.startsWith("/workplace/memberships") ||
      p.startsWith("/workplace/packages") ||
      p.startsWith("/workplace/gift-cards") ||
      p.startsWith("/workplace/reviews") ||
      p.startsWith("/workplace/purchase-orders") ||
      p.startsWith("/workplace/bundles") ||
      p.startsWith("/workplace/kpi") ||
      p.startsWith("/workplace/analytics") ||
      p.startsWith("/workplace/marketing-integrations") ||
      p.startsWith("/workplace/abandoned-bookings") ||
      p.startsWith("/workplace/rebooking") ||
      p.startsWith("/workplace/social-links") ||
      p.startsWith("/workplace/marketplace") ||
      p.startsWith("/workplace/branch-comparison") ||
      p.startsWith("/workplace/chair-rentals") ||
      p.startsWith("/workplace/approvals") ||
      p.startsWith("/workplace/white-label"),
  },
];

type WorkplaceTabBarProps = {
  variant?: "bottom" | "side";
};

export function WorkplaceTabBar({ variant = "bottom" }: WorkplaceTabBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isTablet } = useResponsiveLayout();

  const tabs = WORKPLACE_TABS.filter((tab) => !tab.phoneOnly || (variant === "bottom" && !isTablet));

  const navigate = (href: string) => router.push(href as never);

  if (variant === "side") {
    return (
      <SideTabRail
        tabs={tabs}
        pathname={pathname}
        onNavigate={navigate}
        title="Schedelux"
      />
    );
  }

  return <BottomTabBar tabs={tabs} pathname={pathname} onNavigate={navigate} />;
}

export { WORKPLACE_TABS };
