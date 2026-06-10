import { useCallback, useEffect, useMemo, useState } from "react";
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
import { SimpleBarChart } from "@/components/ui/SimpleBarChart";
import { fetchFinanceProfitLoss } from "@/finance/api";
import type { FinanceProfitLossResponse } from "@/finance/types";
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

function signedMoney(cents: number) {
  const abs = formatMoney(Math.abs(cents), CURRENCY);
  return cents < 0 ? `(${abs})` : abs;
}

export function FinanceProfitLossScreen() {
  const auth = useTenantAuth();
  const [data, setData] = useState<FinanceProfitLossResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      setData(
        await fetchFinanceProfitLoss(auth, {
          from: defaultFromDate(),
          to: defaultToDate(),
        })
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load profit & loss");
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

  const chartPoints = useMemo(() => {
    return (data?.monthly_trend ?? []).map((point) => ({
      label: point.label,
      value: point.profit_cents / 100,
    }));
  }, [data]);

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading && !data) {
    return <LoadingState message="Loading profit & loss…" />;
  }

  const summary = data?.summary;

  return (
    <ResponsiveShell>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <ScreenHeader
          title="Profit & Loss"
          subtitle="Estimated income vs expenses for the last 30 days"
        />

        {error ? (
          <Card>
            <Text style={styles.error}>{error}</Text>
          </Card>
        ) : null}

        <IconStatGrid>
          <IconStatCard
            icon="trending-up-outline"
            label="Net revenue"
            value={formatMoney(summary?.net_revenue_cents ?? 0, CURRENCY)}
            hint="After discounts"
            tint="#059669"
          />
          <IconStatCard
            icon="wallet-outline"
            label="Net profit"
            value={formatMoney(summary?.net_profit_cents ?? 0, CURRENCY)}
            hint={`${summary?.margin_percent ?? 0}% margin`}
            tint="#7C3AED"
          />
          <IconStatCard
            icon="receipt-outline"
            label="Expenses"
            value={formatMoney(summary?.total_expenses_cents ?? 0, CURRENCY)}
            hint="Payroll, fees, refunds"
            tint="#64748B"
          />
          <IconStatCard
            icon="cube-outline"
            label="COGS"
            value={formatMoney(summary?.cogs_cents ?? 0, CURRENCY)}
            tint="#D97706"
          />
        </IconStatGrid>

        {chartPoints.length > 0 ? (
          <>
            <SectionHeader title="Monthly profit" />
            <SimpleBarChart
              title="Profit by month"
              data={chartPoints}
              formatValue={(n) => formatMoney(Math.round(n * 100), CURRENCY)}
            />
          </>
        ) : null}

        <SectionHeader title="Statement" />
        {(data?.sections ?? []).length === 0 ? (
          <EmptyState title="No data yet" description="Complete sales and record expenses to see profit." />
        ) : (
          (data?.sections ?? []).map((row) => (
            <ListRow
              key={row.key}
              icon={row.emphasis ? "stats-chart-outline" : "ellipse-outline"}
              title={row.label}
              subtitle={row.section}
              right={signedMoney(row.amount_cents)}
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
