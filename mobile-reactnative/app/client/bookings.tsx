import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthContext";
import { fetchBookingHistory } from "@/booking/api";
import { formatAppointmentWhen } from "@/booking/format";
import type { Appointment } from "@/booking/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { colors, radii, spacing } from "@/theme/colors";

export default function ClientBookingsScreen() {
  const router = useRouter();
  const { portal, token, tenantSlug } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setLoading(true);
    try {
      const list = await fetchBookingHistory({ token, tenantSlug }, tenantSlug);
      setAppointments(list);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (portal && portal !== "client") return <Redirect href="/" />;

  if (!tenantSlug) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pad}>
          <Header title="My bookings" />
          <EmptyState title="No salon selected" description="Go home and choose a salon first." />
          <Button label="Home" onPress={() => router.replace("/client")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Header
          title="My bookings"
          subtitle="Upcoming and past visits"
          right={<Button label="Back" variant="ghost" onPress={() => router.back()} style={styles.back} />}
        />

        {loading ? (
          <LoadingState />
        ) : appointments.length === 0 ? (
          <EmptyState
            title="No appointments yet"
            description="Book your first visit from the home screen."
            action={<Button label="Book now" onPress={() => router.push("/client/book")} />}
          />
        ) : (
          appointments.map((apt) => (
            <Pressable
              key={apt.uuid}
              onPress={() => router.push(`/client/booking/${apt.uuid}`)}
            >
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={styles.name}>{apt.service?.name ?? "Service"}</Text>
                    <Text style={styles.meta}>
                      {apt.starts_at ? formatAppointmentWhen(apt.starts_at) : "—"}
                    </Text>
                  </View>
                  <Text style={[styles.badge, apt.status === "cancelled" && styles.badgeCancelled]}>
                    {apt.status}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { padding: spacing.lg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  back: { minHeight: 36 },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  flex: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: colors.primaryForeground },
  meta: { fontSize: 13, color: colors.mutedForeground, marginTop: 4 },
  badge: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
    color: colors.primaryForeground,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    overflow: "hidden",
  },
  badgeCancelled: { backgroundColor: "#FEE2E2", color: colors.destructive },
});
