import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatAppointmentWhen, formatMoney } from "@/booking/format";
import type { Appointment } from "@/booking/types";
import {
  fetchTenantAppointments,
  type AppointmentFilter,
  type AppointmentsMeta,
} from "@/workplace/api";
import { colors, radii, spacing } from "@/theme/colors";

const FILTERS: { id: AppointmentFilter | "all"; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "today", label: "Today" },
  { id: "past", label: "Past" },
  { id: "all", label: "All" },
];

export function WorkplaceBookingsList() {
  const router = useRouter();
  const { token, tenantSlug, logout } = useAuth();
  const { gridColumns, isTablet } = useResponsiveLayout();
  const [filter, setFilter] = useState<AppointmentFilter | "all">("upcoming");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [meta, setMeta] = useState<AppointmentsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchTenantAppointments(
        { token, tenantSlug },
        { filter, q: debouncedQuery.trim() || undefined, per_page: 50 }
      );
      setAppointments(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load bookings");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, filter, debouncedQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!tenantSlug) {
    return (
      <ResponsiveShell>
        <ScreenHeader title="Bookings" />
        <EmptyState title="No salon selected" description="This account has no workspace." />
      </ResponsiveShell>
    );
  }

  const cardWidth = gridColumns === 1 ? "100%" : gridColumns === 2 ? "48%" : "31%";

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Bookings"
        subtitle={
          meta
            ? `${meta.total} total · ${meta.summary.today} today · ${meta.summary.upcoming} upcoming`
            : tenantSlug
        }
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search client or service…"
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
        <EmptyState title="No bookings" description="Try another filter or search." />
      ) : (
        <View style={[styles.grid, isTablet && styles.gridTablet]}>
          {appointments.map((apt) => (
            <Pressable
              key={apt.uuid}
              style={{ width: cardWidth }}
              onPress={() => router.push(`/workplace/bookings/${apt.uuid}`)}
            >
              <Card style={styles.bookingCard}>
                <Text style={styles.service}>{apt.service?.name ?? "Service"}</Text>
                <Text style={styles.meta}>
                  {apt.starts_at ? formatAppointmentWhen(apt.starts_at) : "—"}
                </Text>
                {apt.client?.name ? <Text style={styles.client}>{apt.client.name}</Text> : null}
                {apt.staff_member?.display_name ? (
                  <Text style={styles.client}>With {apt.staff_member.display_name}</Text>
                ) : null}
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
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  service: { fontSize: 16, fontWeight: "700", color: colors.primaryForeground, flex: 1 },
  meta: { fontSize: 13, color: colors.mutedForeground },
  client: { fontSize: 13, color: colors.mutedForeground },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    alignItems: "center",
  },
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
