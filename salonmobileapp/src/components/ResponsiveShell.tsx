import { usePathname } from "expo-router";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useHasBottomTabBar, useTabBarInset } from "@/hooks/useTabBarInset";
import { colors, spacing } from "@/theme/colors";

type ResponsiveShellProps = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Extra bottom space (e.g. POS sticky bar on phone). */
  extraBottomInset?: number;
  /** Override auto tab-bar padding. */
  reserveTabBar?: boolean;
};

export function ResponsiveShell({
  children,
  scroll = true,
  style,
  contentStyle,
  extraBottomInset = 0,
  reserveTabBar,
}: ResponsiveShellProps) {
  const pathname = usePathname();
  const { contentMaxWidth, horizontalPadding, isTablet } = useResponsiveLayout();
  const tabBarInset = useTabBarInset();
  const autoTabBar = useHasBottomTabBar(pathname);
  const hasTabBar = reserveTabBar ?? autoTabBar;
  const bottomPad = (hasTabBar ? tabBarInset : spacing.xl) + extraBottomInset;

  const inner = (
    <View
      style={[
        styles.inner,
        {
          maxWidth: contentMaxWidth,
          paddingHorizontal: isTablet ? spacing.xl : horizontalPadding,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View style={[styles.root, style, { paddingBottom: bottomPad }]}>
        <View style={styles.center}>{inner}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, style]}
      contentContainerStyle={[styles.scrollGrow, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.center}>{inner}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollGrow: { flexGrow: 1 },
  center: { alignItems: "center", width: "100%" },
  inner: { width: "100%", paddingTop: spacing.md, gap: spacing.md },
});
