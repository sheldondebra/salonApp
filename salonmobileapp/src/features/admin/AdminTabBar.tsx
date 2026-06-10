import { usePathname, useRouter } from "expo-router";
import { BottomTabBar, type BottomTabItem } from "@/components/BottomTabBar";
import { SideTabRail } from "@/components/SideTabRail";

const ADMIN_TABS: BottomTabItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: "grid-outline",
    activeIcon: "grid",
    match: (p) => p === "/admin" || p === "/admin/",
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: "calendar-outline",
    activeIcon: "calendar",
    match: (p) => p.startsWith("/admin/bookings"),
  },
  {
    href: "/admin/tenants",
    label: "Salons",
    icon: "business-outline",
    activeIcon: "business",
    match: (p) => p.startsWith("/admin/tenants"),
  },
  {
    href: "/admin/more",
    label: "More",
    icon: "ellipsis-horizontal-circle-outline",
    activeIcon: "ellipsis-horizontal-circle",
    match: (p) => p.startsWith("/admin/more"),
  },
];

type AdminTabBarProps = {
  variant?: "bottom" | "side";
};

export function AdminTabBar({ variant = "bottom" }: AdminTabBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navigate = (href: string) => router.push(href as never);

  if (variant === "side") {
    return (
      <SideTabRail tabs={ADMIN_TABS} pathname={pathname} onNavigate={navigate} title="Admin" />
    );
  }

  return <BottomTabBar tabs={ADMIN_TABS} pathname={pathname} onNavigate={navigate} />;
}
