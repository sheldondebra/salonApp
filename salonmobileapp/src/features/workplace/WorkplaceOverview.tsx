import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ChartRangeToggle, SimpleBarChart } from "@/components/ui/SimpleBarChart";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { QuickActionGrid, QuickActionTile } from "@/components/ui/QuickActionTile";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { formatAppointmentWhen, formatMoney } from "@/booking/format";
import type { Appointment } from "@/booking/types";
import { fetchStaffStats } from "@/staff/api";
import type { StaffStats } from "@/staff/types";
import {
  fetchDashboardStats,
  fetchGrowthChart,
  fetchUpcomingAppointments,
  type DashboardStats,
  type GrowthChartPoint,
} from "@/workplace/api";
import { colors, radii, spacing } from "@/theme/colors";

function salonTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function WorkplaceOverview() {
  const router = useRouter();
  const { user, token, tenantSlug, logout } = useAuth();
  const { isTablet } = useResponsiveLayout();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [chartDays, setChartDays] = useState<7 | 30>(7);
  const [chart, setChart] = useState<GrowthChartPoint[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    const auth = { token, tenantSlug };
    setError("");
    try {
      const [statsRes, upcomingRes, chartRes, teamRes] = await Promise.all([
        fetchDashboardStats(auth),
        fetchUpcomingAppointments(auth),
        fetchGrowthChart(auth, chartDays).catch(() => [] as GrowthChartPoint[]),
        fetchStaffStats(auth).catch(() => null),
      ]);
      setStats(statsRes);
      setUpcoming(upcomingRes);
      setChart(chartRes);
      setStaffStats(teamRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load dashboard");
      setStats(null);
      setUpcoming([]);
    }
  }, [token, tenantSlug, chartDays]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const chartPoints = useMemo(() => {
    const slice = chartDays === 30 && !isTablet ? chart.slice(-14) : chart;
    return slice.map((p) => ({
      label: p.label,
      value: p.revenue_cents / 100,
    }));
  }, [chart, chartDays, isTablet]);

  if (!tenantSlug) {
    return (
      <ResponsiveShell>
        <ScreenHeader title="Salon dashboard" />
        <Text style={styles.error}>No salon workspace linked to this account.</Text>
      </ResponsiveShell>
    );
  }

  if (loading) {
    return <LoadingState message="Loading salon dashboard…" />;
  }

  const title = salonTitle(tenantSlug);

  return (
    <ResponsiveShell>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <ScreenHeader
          title={title}
          subtitle={`Hi ${user?.name?.split(" ")[0] ?? "there"} — run your salon from phone or tablet`}
          onRefresh={() => void onRefresh()}
          onSignOut={() => void logout()}
        />

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.error}>{error}</Text>
            <Button label="Retry" onPress={() => void onRefresh()} />
          </Card>
        ) : null}

        {stats ? (
          <>
            <IconStatGrid>
              <IconStatCard
                icon="today-outline"
                label="Today"
                value={String(stats.appointments_today)}
                hint="Appointments"
                tint="#E879A6"
              />
              <IconStatCard
                icon="time-outline"
                label="Pending"
                value={String(stats.pending_bookings)}
                hint="Need action"
                tint="#D97706"
              />
              <IconStatCard
                icon="cash-outline"
                label="Revenue"
                value={formatMoney(stats.revenue_month_cents, "USD")}
                hint="This month"
                tint="#059669"
              />
              <IconStatCard
                icon="cart-outline"
                label="POS today"
                value={formatMoney(stats.pos_sales_today_cents ?? 0, "USD")}
                hint={`${stats.pos_sales_today_count ?? 0} sales`}
                tint="#7C3AED"
              />
            </IconStatGrid>

            {staffStats ? (
              <>
                <SectionHeader
                  title="Staff"
                  actionLabel="Open"
                  onAction={() => router.push("/workplace/team")}
                />
                <IconStatGrid>
                  <IconStatCard
                    icon="people-outline"
                    label="Team"
                    value={String(staffStats.total)}
                    hint={`${staffStats.active} active`}
                    tint="#E879A6"
                  />
                  <IconStatCard
                    icon="checkmark-circle-outline"
                    label="Available"
                    value={String(staffStats.available_now)}
                    hint={`${staffStats.bookable} bookable`}
                    tint="#059669"
                  />
                </IconStatGrid>
              </>
            ) : null}

            <View style={styles.chartHead}>
              <SectionHeader title="Revenue trend" />
              <ChartRangeToggle value={chartDays} onChange={setChartDays} />
            </View>
            {chartPoints.length > 0 ? (
              <SimpleBarChart
                title={`Last ${chartDays} days`}
                data={chartPoints}
                formatValue={(n) => formatMoney(Math.round(n * 100), "USD")}
              />
            ) : (
              <Card>
                <Text style={styles.muted}>No chart data yet for this period.</Text>
              </Card>
            )}

            <SectionHeader title="Quick actions" />
            <QuickActionGrid>
              <QuickActionTile
                icon="calendar-outline"
                label="Bookings"
                onPress={() => router.push("/workplace/bookings")}
              />
              <QuickActionTile
                icon="people-outline"
                label="Clients"
                onPress={() => router.push("/workplace/clients")}
              />
              <QuickActionTile
                icon="cut-outline"
                label="Staff"
                onPress={() => router.push("/workplace/team")}
              />
              <QuickActionTile
                icon="storefront-outline"
                label="Shop & POS"
                onPress={() => router.push("/workplace/shop")}
              />
              <QuickActionTile
                icon="cash-outline"
                label="Finance"
                onPress={() => router.push("/workplace/finance" as never)}
              />
            </QuickActionGrid>

            <SectionHeader
              title="Upcoming appointments"
              actionLabel="See all"
              onAction={() => router.push("/workplace/bookings")}
            />
            {upcoming.length === 0 ? (
              <Card>
                <Text style={styles.muted}>No upcoming appointments.</Text>
              </Card>
            ) : (
              upcoming.slice(0, 8).map((apt) => (
                <ListRow
                  key={apt.uuid}
                  icon="calendar-outline"
                  title={apt.service?.name ?? "Service"}
                  subtitle={[
                    apt.starts_at ? formatAppointmentWhen(apt.starts_at) : null,
                    apt.client?.name,
                    apt.staff_member?.display_name ? `With ${apt.staff_member.display_name}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  right={apt.status}
                  onPress={() => router.push(`/workplace/bookings/${apt.uuid}`)}
                />
              ))
            )}

            <View style={styles.footerStats}>
              <Text style={styles.footerLine}>
                {stats.completed_month} completed · {stats.self_bookings_month} online ·{" "}
                {stats.new_customers_month} new clients this month
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  chartHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  errorCard: { marginBottom: spacing.md },
  error: { color: colors.destructive, marginBottom: spacing.sm },
  muted: { fontSize: 14, color: colors.mutedForeground },
  footerStats: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.muted,
    borderRadius: radii.lg,
  },
  footerLine: { fontSize: 12, color: colors.mutedForeground, lineHeight: 18, textAlign: "center" },
});
