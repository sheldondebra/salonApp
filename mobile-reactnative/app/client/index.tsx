import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { fetchMyTenants } from "@/booking/api";
import type { BookingTenant } from "@/booking/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { colors, radii, spacing } from "@/theme/colors";

export default function ClientHome() {
  const router = useRouter();
  const { portal, token, tenantSlug, user, logout, setActiveTenant } = useAuth();
  const [tenants, setTenants] = useState<BookingTenant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTenants = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await fetchMyTenants({ token });
      setTenants(list);
      if (!tenantSlug && list[0]) {
        await setActiveTenant(list[0].slug);
      }
    } catch {
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, setActiveTenant]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  if (portal && portal !== "client") return <Redirect href="/" />;

  async function selectTenant(slug: string) {
    try {
      await setActiveTenant(slug);
    } catch (err) {
      console.warn(err instanceof ApiError ? err.message : "Could not save salon");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Header
          title="My beauty"
          subtitle={`Hello, ${user?.name?.split(" ")[0] ?? "there"}`}
          right={<Button label="Sign out" variant="ghost" onPress={() => void logout()} style={styles.signOut} />}
        />

        <Text style={styles.sectionLabel}>Your salons</Text>
        {loading ? (
          <LoadingState message="Loading salons…" />
        ) : tenants.length === 0 ? (
          <Card>
            <Text style={styles.empty}>No salons linked yet. Ask your salon to invite you or register with their booking link.</Text>
          </Card>
        ) : (
          tenants.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => void selectTenant(t.slug)}
              style={[styles.tenantCard, tenantSlug === t.slug && styles.tenantCardActive]}
            >
              <Text style={styles.tenantName}>{t.name}</Text>
              <Text style={styles.tenantMeta}>{tenantSlug === t.slug ? "Selected" : "Tap to select"}</Text>
            </Pressable>
          ))
        )}

        <View style={styles.actions}>
          <Button
            label="Book appointment"
            disabled={!tenantSlug}
            onPress={() => router.push("/client/book")}
          />
          <Button
            label="My bookings"
            variant="secondary"
            disabled={!tenantSlug}
            onPress={() => router.push("/client/bookings")}
          />
        </View>

        {!tenantSlug ? (
          <Text style={styles.hint}>Select a salon above to book or view appointments.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  signOut: { minHeight: 40 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
  },
  tenantCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  tenantCardActive: { borderColor: colors.primaryDark, backgroundColor: colors.muted },
  tenantName: { fontSize: 17, fontWeight: "600", color: colors.primaryForeground },
  tenantMeta: { fontSize: 13, color: colors.mutedForeground, marginTop: 4 },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  hint: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", marginTop: spacing.md },
  empty: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
});
