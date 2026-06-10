import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { formatMoney } from "@/booking/format";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { fetchFinanceInsights } from "@/finance/api";
import type { FinanceInsight, FinanceInsightsResponse } from "@/finance/types";
import { colors, spacing } from "@/theme/colors";

const CURRENCY = "GHS";

function defaultFromDate() {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
}

function defaultToDate() {
  return new Date().toISOString().slice(0, 10);
}

function severityTint(severity: string) {
  if (severity === "critical") return "#EF4444";
  if (severity === "warning") return "#D97706";
  if (severity === "opportunity") return "#059669";
  return "#0EA5E9";
}

function InsightRow({ insight }: { insight: FinanceInsight }) {
  return (
    <Card>
      <View style={styles.insightHead}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={[styles.severity, { color: severityTint(insight.severity) }]}>{insight.severity}</Text>
      </View>
      <Text style={styles.insightMessage}>{insight.message}</Text>
      {insight.action ? <Text style={styles.insightAction}>→ {insight.action}</Text> : null}
    </Card>
  );
}

export function FinanceInsightsScreen() {
  const auth = useTenantAuth();
  const { isTablet } = useResponsiveLayout();
  const [data, setData] = useState<FinanceInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      setData(
        await fetchFinanceInsights(auth, {
          from: defaultFromDate(),
          to: defaultToDate(),
        })
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load finance insights");
      setData(null);
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

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading && !data) {
    return <LoadingState message="Loading insights…" />;
  }

  const forecast = data?.forecast;
  const metrics = data?.metrics;

  return (
    <ResponsiveShell>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <ScreenHeader
          title="Finance insights"
          subtitle="Forecasts, warnings, and suggested actions"
        />

        {error ? (
          <Card>
            <Text style={styles.error}>{error}</Text>
          </Card>
        ) : null}

        <IconStatGrid>
          <IconStatCard
            icon="trending-up-outline"
            label="Projected month"
            value={formatMoney(forecast?.projected_month_revenue_cents ?? 0, CURRENCY)}
            hint={`MTD ${formatMoney(forecast?.mtd_revenue_cents ?? 0, CURRENCY)}`}
            tint="#059669"
          />
          <IconStatCard
            icon="alert-circle-outline"
            label="Refund rate"
            value={`${metrics?.refund_rate_percent ?? 0}%`}
            tint="#EF4444"
          />
          <IconStatCard
            icon="people-outline"
            label="Payroll ratio"
            value={`${metrics?.payroll_to_revenue_percent ?? 0}%`}
            tint="#0EA5E9"
          />
          <IconStatCard
            icon="bulb-outline"
            label="Expense change"
            value={`${metrics?.expense_change_percent ?? 0}%`}
            tint="#D97706"
          />
        </IconStatGrid>

        <SectionHeader title="Insight feed" />
        {(data?.insights ?? []).length === 0 ? (
          <EmptyState title="No insights yet" description="Complete more sales to unlock finance advice." />
        ) : (
          (data?.insights ?? []).map((insight) => <InsightRow key={insight.id} insight={insight} />)
        )}

        <SectionHeader title="Alert channels" />
        {(data?.alert_channels ?? []).map((channel) => (
          <ListRow
            key={channel.channel}
            icon={channel.channel === "push" ? "notifications-outline" : "chatbubble-ellipses-outline"}
            title={channel.label}
            subtitle={channel.note}
            right={channel.enabled ? "On" : "Soon"}
          />
        ))}

        <SectionHeader title="Busiest days" />
        {(data?.busiest_days ?? []).length === 0 ? (
          <EmptyState title="No day pattern yet" description="Revenue by weekday appears after more activity." />
        ) : (
          (data?.busiest_days ?? []).slice(0, isTablet ? 7 : 5).map((day) => (
            <ListRow
              key={day.label}
              icon="calendar-outline"
              title={day.label}
              subtitle="Revenue"
              right={formatMoney(day.revenue_cents, CURRENCY)}
            />
          ))
        )}

        {isTablet && (data?.highlights?.top_staff ?? []).length > 0 ? (
          <>
            <SectionHeader title="Top revenue staff" />
            {(data?.highlights?.top_staff ?? []).slice(0, 5).map((row) => (
              <ListRow
                key={row.staff_id ?? row.name}
                icon="person-outline"
                title={row.name}
                subtitle="Appointment revenue"
                right={formatMoney(row.revenue_cents, CURRENCY)}
              />
            ))}
          </>
        ) : null}

        {isTablet && (data?.highlights?.underperforming_services ?? []).length > 0 ? (
          <>
            <SectionHeader title="Underperforming services" />
            {(data?.highlights?.underperforming_services ?? []).map((row) => (
              <ListRow
                key={row.service_id}
                icon="cut-outline"
                title={row.name}
                subtitle="Below typical yield"
                right={formatMoney(row.avg_revenue_cents, CURRENCY)}
              />
            ))}
          </>
        ) : null}
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing["3xl"], gap: spacing.md },
  error: { color: colors.destructive, fontSize: 14 },
  insightHead: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm, marginBottom: spacing.xs },
  insightTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.foreground },
  severity: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  insightMessage: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  insightAction: { marginTop: spacing.sm, fontSize: 13, fontWeight: "600", color: colors.foreground },
});
