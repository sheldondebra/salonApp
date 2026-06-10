import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text } from "react-native";
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
import { SimpleBarChart } from "@/components/ui/SimpleBarChart";
import { fetchFinanceTips } from "@/finance/api";
import type { FinanceTipEntry } from "@/finance/types";
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

export function FinanceTipsScreen() {
  const auth = useTenantAuth();
  const [rows, setRows] = useState<FinanceTipEntry[]>([]);
  const [summary, setSummary] = useState<{
    total_tips_cents: number;
    tip_count: number;
    average_tip_cents: number;
  } | null>(null);
  const [trend, setTrend] = useState<Array<{ label: string; tips_cents: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const res = await fetchFinanceTips(auth, {
        from: defaultFromDate(),
        to: defaultToDate(),
      });
      setRows(res.data ?? []);
      setSummary(res.meta?.summary ?? null);
      setTrend(res.meta?.monthly_trend ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load tips");
      setRows([]);
      setSummary(null);
      setTrend([]);
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

  if (loading && rows.length === 0) {
    return <LoadingState message="Loading tips…" />;
  }

  const chartPoints = trend.slice(-6).map((point) => ({
    label: point.label,
    value: point.tips_cents / 100,
  }));

  return (
    <ResponsiveShell>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <ScreenHeader
          title="Tips"
          subtitle="Tips collected at POS checkout in the last 30 days"
        />

        {error ? (
          <Card>
            <Text style={styles.error}>{error}</Text>
          </Card>
        ) : null}

        <IconStatGrid>
          <IconStatCard
            icon="heart-outline"
            label="Total tips"
            value={formatMoney(summary?.total_tips_cents ?? 0, CURRENCY)}
            hint={`${summary?.tip_count ?? 0} checkouts`}
            tint="#EC4899"
          />
          <IconStatCard
            icon="stats-chart-outline"
            label="Average tip"
            value={formatMoney(summary?.average_tip_cents ?? 0, CURRENCY)}
            tint="#7C3AED"
          />
        </IconStatGrid>

        {chartPoints.length > 0 ? (
          <>
            <SectionHeader title="Monthly trend" />
            <SimpleBarChart
              title="Tips by month"
              data={chartPoints}
              formatValue={(n) => formatMoney(Math.round(n * 100), CURRENCY)}
            />
          </>
        ) : null}

        <SectionHeader title="Tip entries" />
        {rows.length === 0 ? (
          <EmptyState
            title="No tips yet"
            description="Add a tip when completing a POS sale to track staff gratuities."
          />
        ) : (
          rows.map((row) => (
            <ListRow
              key={row.id}
              icon="heart-outline"
              title={row.customer?.name ?? row.sale_number ?? "POS sale"}
              subtitle={[row.payment_method, row.branch?.name].filter(Boolean).join(" · ") || "Checkout"}
              right={formatMoney(row.tip_cents, row.currency || CURRENCY)}
            />
          ))
        )}
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing["3xl"], gap: spacing.md },
  error: { color: colors.destructive, fontSize: 14 },
});
