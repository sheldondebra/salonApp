import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ChartRangeToggle, SimpleBarChart } from "@/components/ui/SimpleBarChart";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { formatMoney } from "@/booking/format";
import { fetchFinanceInsights, fetchFinanceOverview } from "@/finance/api";
import type { FinanceInsight, FinanceOverview } from "@/finance/types";
import { FinanceModuleList } from "@/features/finance/FinanceModuleList";
import { colors, spacing } from "@/theme/colors";

function insightTint(severity: string) {
  if (severity === "critical") return "#EF4444";
  if (severity === "warning") return "#D97706";
  if (severity === "opportunity") return "#059669";
  return "#0EA5E9";
}

export function FinanceHomeScreen() {
  const router = useRouter();
  const auth = useTenantAuth();
  const { isTablet } = useResponsiveLayout();
  const [data, setData] = useState<FinanceOverview | null>(null);
  const [insights, setInsights] = useState<FinanceInsight[]>([]);
  const [chartDays, setChartDays] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const [overview, insightsRes] = await Promise.all([
        fetchFinanceOverview(auth),
        fetchFinanceInsights(auth).catch(() => null),
      ]);
      setData(overview);
      const priority = insightsRes?.insights ?? [];
      setInsights(
        priority
          .filter((row) => row.severity === "critical" || row.severity === "warning")
          .slice(0, 3)
          .concat(priority.filter((row) => row.severity !== "critical" && row.severity !== "warning").slice(0, 1))
          .slice(0, 3)
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load finance overview");
      setData(null);
      setInsights([]);
    }
  }, [auth]);

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
    const series = data?.charts.revenue_trend ?? [];
    const slice = chartDays === 30 && !isTablet ? series.slice(-14) : series.slice(-chartDays);
    return slice.map((p) => ({ label: p.label, value: (p.revenue_cents ?? 0) / 100 }));
  }, [data, chartDays, isTablet]);

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading && !data) {
    return <LoadingState message="Loading finance…" />;
  }

  const currency = "GHS";
  const cards = data?.cards;

  return (
    <ResponsiveShell>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <ScreenHeader
          title="Finance"
          subtitle="Revenue, payments, payroll, and smart insights"
        />

        {error ? (
          <Card>
            <Text style={styles.error}>{error}</Text>
          </Card>
        ) : null}

        <IconStatGrid>
          <IconStatCard
            icon="cash-outline"
            label="Today"
            value={formatMoney(cards?.revenue_today_cents ?? 0, currency)}
            hint="Revenue"
            tint="#E879A6"
          />
          <IconStatCard
            icon="trending-up-outline"
            label="This month"
            value={formatMoney(cards?.revenue_month_cents ?? 0, currency)}
            hint="Revenue"
            tint="#059669"
          />
          <IconStatCard
            icon="wallet-outline"
            label="Net"
            value={formatMoney(cards?.net_revenue_cents ?? 0, currency)}
            hint="After costs"
            tint="#7C3AED"
          />
          <IconStatCard
            icon="document-text-outline"
            label="Invoices"
            value={formatMoney(cards?.outstanding_invoices_cents ?? 0, currency)}
            hint="Outstanding"
            tint="#D97706"
          />
          <IconStatCard
            icon="receipt-outline"
            label="Expenses"
            value={formatMoney(cards?.expenses_cents ?? 0, currency)}
            tint="#64748B"
          />
          <IconStatCard
            icon="people-outline"
            label="Payroll"
            value={formatMoney(cards?.payroll_due_cents ?? 0, currency)}
            hint="Estimated due"
            tint="#0EA5E9"
          />
          <IconStatCard
            icon="heart-outline"
            label="Tips"
            value={formatMoney(cards?.tips_collected_cents ?? 0, currency)}
            tint="#EC4899"
          />
          <IconStatCard
            icon="arrow-undo-outline"
            label="Refunds"
            value={formatMoney(cards?.refunds_cents ?? 0, currency)}
            tint="#EF4444"
          />
        </IconStatGrid>

        {insights.length > 0 ? (
          <>
            <SectionHeader
              title="Alerts & insights"
              actionLabel="See all"
              onAction={() => router.push("/workplace/finance/insights" as never)}
            />
            {insights.map((insight) => (
              <Pressable
                key={insight.id}
                onPress={() => router.push("/workplace/finance/insights" as never)}
              >
                <ListRow
                  icon="bulb-outline"
                  iconTint={insightTint(insight.severity)}
                  title={insight.title}
                  subtitle={insight.message}
                  right={insight.severity}
                />
              </Pressable>
            ))}
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
            formatValue={(n) => formatMoney(Math.round(n * 100), currency)}
          />
        ) : (
          <Card>
            <Text style={styles.muted}>No revenue in this period yet.</Text>
          </Card>
        )}

        <SectionHeader title="Wallet snapshot" />
        <IconStatGrid>
          <IconStatCard
            icon="wallet-outline"
            label="Available"
            value={formatMoney(cards?.wallet_available_cents ?? 0, currency)}
            tint="#059669"
          />
          <IconStatCard
            icon="time-outline"
            label="Pending"
            value={formatMoney(cards?.wallet_pending_cents ?? 0, currency)}
          />
          <IconStatCard
            icon="alert-circle-outline"
            label="Failed"
            value={String(cards?.failed_payments_count ?? 0)}
            hint="Payments"
            tint="#EF4444"
          />
        </IconStatGrid>

        <FinanceModuleList />

        <SectionHeader title="Recent payments" />
        {(data?.recent_payments ?? []).length === 0 ? (
          <EmptyState title="No payments yet" description="MoMo requests and card payments will show here." />
        ) : (
          (data?.recent_payments ?? []).slice(0, isTablet ? 10 : 6).map((row) => (
            <ListRow
              key={`${row.source}-${row.id}`}
              icon="card-outline"
              title={row.customer_name ?? row.reference}
              subtitle={`${row.status} · ${row.source === "payment_request" ? "MoMo" : "Gateway"}`}
              right={formatMoney(row.amount_cents, row.currency || currency)}
              onPress={() => router.push("/workplace/finance/transactions" as never)}
            />
          ))
        )}
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing["3xl"], gap: spacing.md },
  chartHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  muted: { color: colors.muted, fontSize: 14 },
  error: { color: colors.destructive, fontSize: 14 },
});
