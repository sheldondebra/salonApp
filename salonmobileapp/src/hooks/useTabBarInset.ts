import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { spacing } from "@/theme/colors";

/** Visible height of bottom tab bar (excluding safe area). */
export const BOTTOM_TAB_BAR_HEIGHT = 56;

/** Sticky POS checkout bar on phone (above tab bar). */
export const POS_STICKY_BAR_HEIGHT = 68;

export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsiveLayout();
  const bottomTabs = !isTablet;
  const tabPart = bottomTabs ? BOTTOM_TAB_BAR_HEIGHT : 0;
  const safePart = bottomTabs ? Math.max(insets.bottom, spacing.sm) : 0;
  return tabPart + safePart;
}

export function useHasBottomTabBar(pathname: string): boolean {
  const { isTablet } = useResponsiveLayout();
  if (isTablet) return false;
  if (/\/bookings\/[^/]+/.test(pathname)) return false;
  return pathname.startsWith("/workplace") || pathname.startsWith("/admin");
}
