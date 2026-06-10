import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabItem } from "@/components/BottomTabBar";
import { colors, radii, spacing } from "@/theme/colors";

type SideTabRailProps = {
  tabs: BottomTabItem[];
  pathname: string;
  onNavigate: (href: string) => void;
  title?: string;
};

export function SideTabRail({ tabs, pathname, onNavigate, title = "Menu" }: SideTabRailProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.rail, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>{title}</Text>
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        const iconName = active && tab.activeIcon ? tab.activeIcon : tab.icon;
        return (
          <Pressable
            key={tab.href}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onNavigate(tab.href)}
            style={[styles.item, active && styles.itemActive]}
          >
            <Ionicons
              name={iconName}
              size={24}
              color={active ? colors.accent : colors.mutedForeground}
            />
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={2}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 100,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.lg,
  },
  itemActive: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedForeground,
    textAlign: "center",
  },
  labelActive: {
    color: colors.primaryForeground,
    fontWeight: "700",
  },
});
