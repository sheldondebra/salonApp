import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchAdminDashboard } from "@/admin/api";
import { canViewOfficeDashboard } from "@/admin/permissions";
import type { AdminDashboard, PlatformAlert } from "@/admin/types";
import { useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/api/client";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { QuickActionGrid, QuickActionTile } from "@/components/ui/QuickActionTile";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SimpleBarChart, type ChartPoint } from "@/components/ui/SimpleBarChart";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { formatMoney } from "@/booking/format";
import { colors, radii, spacing } from "@/theme/colors";

function cardsFromDashboard(data: AdminDashboard) {
  return (
    data.cards ?? {
      active_tenants: data.stats.tenants,
      trial_tenants: data.stats.trial_tenants ?? 0,
      mrr_cents: data.stats.mrr_cents ?? 0,
      revenue_collected_cents: data.stats.revenue_cents,
      failed_payments: data.stats.failed_payments ?? 0,
      open_support_tickets: data.stats.open_support_tickets ?? 0,
      sms_balance: data.stats.mnotify_balance,
      provider_incidents: data.stats.provider_incidents ?? 0,
    }
  );
}

function chartPoints(series: { month: string; count?: number; revenue_cents?: number; amount_cents?: number }[] | undefined, key: "count" | "revenue_cents" | "amount_cents"): ChartPoint[] {
  return (series ?? []).map((point) => ({
    label: point.month.slice(5),
    value: point[key] ?? 0,
  }));
}

function UrgentCard({
  title,
  count,
  tint,
  onPress,
}: {
  title: string;
  count: number;
  tint: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.urgentCard, { borderColor: `${tint}55` }]}>
      <Text style={[styles.urgentCount, { color: tint }]}>{count}</Text>
      <Text style={styles.urgentTitle}>{title}</Text>
    </Pressable>
  );
}

export function AdminOverview() {
  const router = useRouter();
  const { user, token, logout, me } = useAuth();
  const { isTablet, gridColumns } = useResponsiveLayout();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setData(await fetchAdminDashboard({ token }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = useMemo(() => (data ? cardsFromDashboard(data) : null), [data]);
  const alerts = data?.alerts ?? [];

  if (!canViewOfficeDashboard(me)) {
    return (
      <ResponsiveShell>
        <Card>
          <Text style={styles.error}>Your account cannot view the General Office command center.</Text>
        </Card>
      </ResponsiveShell>
    );
  }

  if (loading) {
    return <LoadingState message="Loading command center…" />;
  }

  function openTenantSearch() {
    const q = search.trim();
    router.push((q ? `/admin/tenants?q=${encodeURIComponent(q)}` : "/admin/tenants") as never);
  }

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="General Office"
        subtitle={user?.email ?? "Platform command center"}
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />

      {error ? (
        <Card>
          <Text style={styles.error}>{error}</Text>
          <Button label="Retry" onPress={() => void load()} />
        </Card>
      ) : null}

      <Card>
        <Text style={styles.searchLabel}>Tenant search</Text>
        <View style={styles.searchRow}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Name, slug, owner email…"
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={openTenantSearch}
          />
          <Pressable style={styles.searchBtn} onPress={openTenantSearch}>
            <Ionicons name="search" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </Card>

      {cards ? (
        <>
          <SectionHeader title="Needs attention" />
          <View style={styles.urgentGrid}>
            <UrgentCard
              title="Failed payments"
              count={cards.failed_payments}
              tint="#DC2626"
              onPress={() => router.push("/admin/more" as never)}
            />
            <UrgentCard
              title="Support tickets"
              count={cards.open_support_tickets}
              tint="#D97706"
              onPress={() => router.push("/admin/more" as never)}
            />
            <UrgentCard
              title="Provider incidents"
              count={cards.provider_incidents}
              tint="#7C3AED"
              onPress={() => router.push("/admin/more" as never)}
            />
            {(alerts as PlatformAlert[]).slice(0, 1).map((alert) => (
              <UrgentCard key={alert.type} title={alert.title} count={alert.count} tint={colors.primaryDark} />
            ))}
          </View>

          <SectionHeader title="Executive metrics" />
          <IconStatGrid>
            <IconStatCard icon="business-outline" label="Active tenants" value={String(cards.active_tenants)} />
            <IconStatCard icon="time-outline" label="Trial tenants" value={String(cards.trial_tenants)} tint="#D97706" />
            <IconStatCard icon="trending-up-outline" label="MRR" value={formatMoney(cards.mrr_cents, "GHS")} tint="#059669" />
            <IconStatCard
              icon="cash-outline"
              label="Revenue"
              value={formatMoney(cards.revenue_collected_cents, "GHS")}
              tint="#7C3AED"
            />
            <IconStatCard icon="chatbubble-outline" label="SMS balance" value={String(cards.sms_balance)} />
            <IconStatCard
              icon="alert-circle-outline"
              label="Failed payments"
              value={String(cards.failed_payments)}
              tint="#DC2626"
            />
          </IconStatGrid>

          {isTablet && data?.charts ? (
            <View style={[styles.chartGrid, gridColumns >= 2 && styles.chartGridTablet]}>
              <SimpleBarChart
                title="MRR trend"
                data={chartPoints(data.charts.mrr_trend, "revenue_cents")}
                formatValue={(n) => formatMoney(n, "GHS")}
              />
              <SimpleBarChart title="Tenant growth" data={chartPoints(data.charts.tenant_growth, "count")} />
              <SimpleBarChart
                title="Payment volume"
                data={chartPoints(data.charts.payment_volume, "amount_cents")}
                formatValue={(n) => formatMoney(n, "GHS")}
              />
              <SimpleBarChart title="Support tickets" data={chartPoints(data.charts.support_ticket_trend, "count")} accentColor="#D97706" />
            </View>
          ) : null}

          <SectionHeader title="Quick actions" />
          <QuickActionGrid>
            <QuickActionTile icon="business-outline" label="Salons" onPress={() => router.push("/admin/tenants")} />
            <QuickActionTile icon="calendar-outline" label="Bookings" onPress={() => router.push("/admin/bookings")} />
            <QuickActionTile icon="search-outline" label="Search tenant" onPress={openTenantSearch} />
          </QuickActionGrid>

          <Card>
            <Text style={styles.sectionTitle}>Recent salons</Text>
            {(data?.recent_tenants ?? []).length === 0 ? (
              <Text style={styles.muted}>No tenants yet.</Text>
            ) : (
              (data?.recent_tenants ?? []).map((t) => (
                <View key={t.slug} style={styles.tenantRow}>
                  <View style={styles.flex}>
                    <Text style={styles.tenantName}>{t.name}</Text>
                    <Text style={styles.muted}>{t.slug}</Text>
                  </View>
                  <Text style={styles.badge}>{t.status ?? "—"}</Text>
                </View>
              ))
            )}
          </Card>
        </>
      ) : null}
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.destructive, marginBottom: spacing.md },
  searchLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.35,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
  },
  searchRow: { flexDirection: "row", gap: spacing.sm },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.primaryForeground,
    backgroundColor: colors.surface,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  urgentGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  urgentCard: {
    flexGrow: 1,
    minWidth: "46%",
    borderWidth: 1,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: 4,
  },
  urgentCount: { fontSize: 24, fontWeight: "800" },
  urgentTitle: { fontSize: 13, fontWeight: "600", color: colors.primaryForeground },
  chartGrid: { gap: spacing.md },
  chartGridTablet: { flexDirection: "row", flexWrap: "wrap" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.primaryForeground, marginBottom: spacing.md },
  tenantRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  flex: { flex: 1 },
  tenantName: { fontSize: 15, fontWeight: "600", color: colors.primaryForeground },
  muted: { fontSize: 13, color: colors.mutedForeground },
  badge: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryForeground,
    backgroundColor: colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
});
