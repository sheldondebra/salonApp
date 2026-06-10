import { Redirect, Stack, usePathname } from "expo-router";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthContext";
import { AdminTabBar } from "@/features/admin/AdminTabBar";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { colors } from "@/theme/colors";

export default function AdminLayout() {
  const { portal } = useAuth();
  const pathname = usePathname();
  const { isTablet } = useResponsiveLayout();
  const hideNav = /\/admin\/bookings\/[^/]+/.test(pathname);

  if (portal && portal !== "admin") {
    return <Redirect href="/" />;
  }

  const useSideNav = isTablet && !hideNav;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.row, useSideNav && styles.rowTablet]}>
        {useSideNav ? <AdminTabBar variant="side" /> : null}
        <View style={styles.body}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
        </View>
      </View>
      {!useSideNav && !hideNav ? <AdminTabBar variant="bottom" /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  row: { flex: 1 },
  rowTablet: { flexDirection: "row" },
  body: { flex: 1, minWidth: 0 },
});
