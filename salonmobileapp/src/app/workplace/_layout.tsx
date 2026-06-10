import { Redirect, Stack, usePathname } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthContext";
import { WorkplaceTabBar } from "@/features/workplace/WorkplaceTabBar";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { colors } from "@/theme/colors";

export default function WorkplaceLayout() {
  const { portal } = useAuth();
  const pathname = usePathname();
  const { isTablet } = useResponsiveLayout();
  const hideNav =
    /\/workplace\/bookings\/[^/]+/.test(pathname) ||
    /\/workplace\/team\/(new|\d+)/.test(pathname) ||
    /\/workplace\/team\/\d+\/edit/.test(pathname) ||
    /\/workplace\/team\/\d+\/services/.test(pathname) ||
    /\/workplace\/team\/\d+\/hours/.test(pathname) ||
    /\/workplace\/finance\//.test(pathname) ||
    /\/workplace\/payment-requests\/.+/.test(pathname);

  if (portal && portal !== "workplace") {
    return <Redirect href="/" />;
  }

  const useSideNav = isTablet && !hideNav;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.row, useSideNav && styles.rowTablet]}>
        {useSideNav ? <WorkplaceTabBar variant="side" /> : null}
        <View style={styles.body}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
        </View>
      </View>
      {!useSideNav && !hideNav ? <WorkplaceTabBar variant="bottom" /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  row: { flex: 1 },
  rowTablet: { flexDirection: "row" },
  body: { flex: 1, minWidth: 0 },
});
