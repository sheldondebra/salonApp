import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { BOTTOM_TAB_BAR_HEIGHT } from "@/hooks/useTabBarInset";
import { colors, radii, spacing } from "@/theme/colors";

export type BottomTabItem = {
  href: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
  phoneOnly?: boolean;
  match: (path: string) => boolean;
};

type BottomTabBarProps = {
  tabs: BottomTabItem[];
  pathname: string;
  onNavigate: (href: string) => void;
};

export function BottomTabBar({ tabs, pathname, onNavigate }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width, horizontalPadding } = useResponsiveLayout();
  const compact = width < 380;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          paddingHorizontal: horizontalPadding,
        },
      ]}
    >
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const iconName = active && tab.activeIcon ? tab.activeIcon : tab.icon;
          return (
            <Pressable
              key={tab.href}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
              onPress={() => onNavigate(tab.href)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Ionicons
                name={iconName}
                size={compact ? 22 : 24}
                color={active ? colors.accent : colors.mutedForeground}
              />
              {!compact ? (
                <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                  {tab.label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: "#3D2230",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  bar: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: BOTTOM_TAB_BAR_HEIGHT,
    paddingTop: spacing.xs,
    gap: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: radii.md,
    minWidth: 0,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.mutedForeground,
    textAlign: "center",
  },
  labelActive: {
    color: colors.primaryForeground,
  },
});
