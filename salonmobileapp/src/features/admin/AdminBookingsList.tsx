import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import {
  fetchAdminAppointments,
  type AppointmentFilter,
} from "@/admin/api";
import type { AdminAppointment, AdminAppointmentsMeta } from "@/admin/types";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { formatAppointmentWhen, formatMoney } from "@/booking/format";
import { colors, radii, spacing } from "@/theme/colors";

const FILTERS: { id: AppointmentFilter | "all"; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "today", label: "Today" },
  { id: "past", label: "Past" },
  { id: "all", label: "All" },
];

export function AdminBookingsList() {
  const router = useRouter();
  const { token } = useAuth();
  const { gridColumns, isTablet } = useResponsiveLayout();
  const [filter, setFilter] = useState<AppointmentFilter | "all">("upcoming");
  const [query, setQuery] = useState("");
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [meta, setMeta] = useState<AdminAppointmentsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchAdminAppointments(
        { token },
        { filter: filter === "all" ? undefined : filter, q: query.trim() || undefined, per_page: 50 }
      );
      setAppointments(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load bookings");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [token, filter, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const cardWidth =
    gridColumns === 1 ? "100%" : gridColumns === 2 ? "48%" : "31%";

  return (
    <ResponsiveShell>
      <Header
        title="All bookings"
        subtitle={
          meta
            ? `${meta.total} total · ${meta.summary.today} today · ${meta.summary.upcoming} upcoming`
            : "Across every salon on the platform"
        }
      />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search client, service, salon…"
        placeholderTextColor={colors.mutedForeground}
        style={styles.search}
        onSubmitEditing={() => void load()}
        returnKeyType="search"
      />

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={[styles.chip, filter === f.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f.id && styles.chipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <Button label="Search" variant="secondary" onPress={() => void load()} />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <Card>
          <Text style={styles.error}>{error}</Text>
          <Button label="Retry" onPress={() => void load()} />
        </Card>
      ) : appointments.length === 0 ? (
        <EmptyState title="No bookings found" description="Try another filter or search term." />
      ) : (
        <View style={[styles.grid, isTablet && styles.gridTablet]}>
          {appointments.map((apt) => (
            <Pressable
              key={apt.uuid}
              style={{ width: cardWidth }}
              onPress={() => router.push(`/admin/bookings/${apt.uuid}`)}
            >
              <Card style={styles.bookingCard}>
                <Text style={styles.salon}>{apt.tenant?.name ?? "Salon"}</Text>
                <Text style={styles.service}>{apt.service?.name ?? "Service"}</Text>
                <Text style={styles.meta}>
                  {apt.starts_at ? formatAppointmentWhen(apt.starts_at) : "—"}
                </Text>
                {apt.client?.name ? <Text style={styles.client}>{apt.client.name}</Text> : null}
                <View style={styles.row}>
                  <Text style={[styles.status, apt.status === "cancelled" && styles.cancelled]}>
                    {apt.status}
                  </Text>
                  <Text style={styles.price}>
                    {formatMoney(apt.amount_due_cents ?? apt.service?.price_cents ?? 0, "USD")}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.black,
  },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  chipTextActive: { color: colors.primaryForeground },
  grid: { gap: spacing.md },
  gridTablet: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  bookingCard: { gap: 4 },
  salon: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", color: colors.accent },
  service: { fontSize: 16, fontWeight: "700", color: colors.primaryForeground },
  meta: { fontSize: 13, color: colors.mutedForeground },
  client: { fontSize: 13, color: colors.mutedForeground },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm, alignItems: "center" },
  status: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
    color: colors.primaryForeground,
    backgroundColor: colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  cancelled: { color: colors.destructive, backgroundColor: "#FEE2E2" },
  price: { fontSize: 14, fontWeight: "600", color: colors.primaryForeground },
  error: { color: colors.destructive, marginBottom: spacing.md },
});
