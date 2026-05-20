import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { checkApiHealth } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { portalLabel } from "@/auth/roles";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { colors, spacing } from "@/theme/colors";

type PortalHomeProps = {
  title: string;
  description: string;
};

export function PortalHome({ title, description }: PortalHomeProps) {
  const { user, portal, tenantSlug, logout } = useAuth();
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "error">("checking");
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await checkApiHealth();
        if (!cancelled) {
          setApiStatus("ok");
          setApiMessage(`${res.service} · ${res.status}`);
        }
      } catch (err) {
        if (!cancelled) {
          setApiStatus("error");
          setApiMessage(err instanceof Error ? err.message : "API unreachable");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user || !portal) {
    return <LoadingState message="Preparing your workspace…" />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Header
          title={title}
          subtitle={description}
          right={
            <Button label="Sign out" variant="ghost" onPress={() => void logout()} style={styles.logout} />
          }
        />

        <Card>
          <Text style={styles.cardLabel}>Signed in as</Text>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.meta}>{user.email}</Text>
          <View style={styles.badges}>
            <Text style={styles.badge}>{portalLabel(portal)}</Text>
            {tenantSlug ? <Text style={styles.badgeMuted}>· {tenantSlug}</Text> : null}
          </View>
        </Card>

        <Card style={styles.gap}>
          <Text style={styles.cardLabel}>API connection</Text>
          <Text style={apiStatus === "ok" ? styles.ok : styles.error}>
            {apiStatus === "checking" ? "Checking…" : apiMessage}
          </Text>
          <Text style={styles.hint}>
            Batch 37+ will add booking, staff schedules, and dashboards here. Foundation is ready.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  logout: { minHeight: 40, paddingHorizontal: 12 },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
  },
  name: { fontSize: 20, fontWeight: "700", color: colors.primaryForeground },
  meta: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  badges: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.sm, alignItems: "center" },
  badge: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primaryForeground,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  badgeMuted: { fontSize: 13, color: colors.mutedForeground },
  gap: { marginTop: spacing.md },
  ok: { fontSize: 15, color: colors.success, fontWeight: "500" },
  error: { fontSize: 15, color: colors.destructive, fontWeight: "500" },
  hint: { fontSize: 13, color: colors.mutedForeground, marginTop: spacing.sm, lineHeight: 19 },
});
