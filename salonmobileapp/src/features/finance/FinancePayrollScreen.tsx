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
import { fetchFinancePayroll } from "@/finance/api";
import type { FinancePayrollResponse } from "@/finance/types";
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

export function FinancePayrollScreen() {
  const auth = useTenantAuth();
  const [data, setData] = useState<FinancePayrollResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      setData(
        await fetchFinancePayroll(auth, {
          from: defaultFromDate(),
          to: defaultToDate(),
        })
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load payroll");
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
    return <LoadingState message="Loading payroll…" />;
  }

  const summary = data?.summary;

  return (
    <ResponsiveShell>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <ScreenHeader
          title="Payroll"
          subtitle="Estimated earnings for the last 30 days"
        />

        {error ? (
          <Card>
            <Text style={styles.error}>{error}</Text>
          </Card>
        ) : null}

        <IconStatGrid>
          <IconStatCard
            icon="people-outline"
            label="Total payroll"
            value={formatMoney(summary?.total_payroll_cents ?? 0, CURRENCY)}
            hint={`${summary?.staff_count ?? 0} staff`}
            tint="#0EA5E9"
          />
          <IconStatCard
            icon="wallet-outline"
            label="Base pay"
            value={formatMoney(summary?.base_pay_cents ?? 0, CURRENCY)}
          />
          <IconStatCard
            icon="trending-up-outline"
            label="Commissions"
            value={formatMoney(summary?.commission_cents ?? 0, CURRENCY)}
            tint="#059669"
          />
          <IconStatCard
            icon="heart-outline"
            label="Tips owed"
            value={formatMoney(summary?.tips_owed_cents ?? 0, CURRENCY)}
            tint="#EC4899"
          />
        </IconStatGrid>

        <SectionHeader title="Staff earnings" />
        {(data?.staff ?? []).length === 0 ? (
          <EmptyState
            title="No earnings yet"
            description="Set up pay profiles under Team and complete appointments to see estimates."
          />
        ) : (
          (data?.staff ?? []).map((row) => (
            <ListRow
              key={row.staff_member_id}
              icon="person-outline"
              title={row.staff_name}
              subtitle={`${row.pay_role_name ?? row.pay_type} · ${row.approval_status}`}
              right={formatMoney(row.total_earnings_cents, CURRENCY)}
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
