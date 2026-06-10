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
import { fetchFinanceTransactions } from "@/finance/api";
import type { FinanceLedgerEntry } from "@/finance/types";
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

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function FinanceTransactionsScreen() {
  const auth = useTenantAuth();
  const [rows, setRows] = useState<FinanceLedgerEntry[]>([]);
  const [summary, setSummary] = useState<{
    income_cents: number;
    net_cents: number;
    paid_count: number;
    pending_count: number;
    failed_count: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const res = await fetchFinanceTransactions(auth, {
        from: defaultFromDate(),
        to: defaultToDate(),
      });
      setRows(res.data ?? []);
      setSummary(res.meta?.summary ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load transactions");
      setRows([]);
      setSummary(null);
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
    return <LoadingState message="Loading transactions…" />;
  }

  return (
    <ResponsiveShell>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <ScreenHeader
          title="Transaction history"
          subtitle="Payments, refunds, and ledger entries for the last 30 days"
        />

        {error ? (
          <Card>
            <Text style={styles.error}>{error}</Text>
          </Card>
        ) : null}

        <IconStatGrid>
          <IconStatCard
            icon="trending-up-outline"
            label="Income"
            value={formatMoney(summary?.income_cents ?? 0, CURRENCY)}
            tint="#059669"
          />
          <IconStatCard
            icon="wallet-outline"
            label="Net"
            value={formatMoney(summary?.net_cents ?? 0, CURRENCY)}
            tint="#7C3AED"
          />
          <IconStatCard
            icon="checkmark-circle-outline"
            label="Paid"
            value={String(summary?.paid_count ?? 0)}
            tint="#0EA5E9"
          />
          <IconStatCard
            icon="alert-circle-outline"
            label="Failed"
            value={String(summary?.failed_count ?? 0)}
            tint="#EF4444"
          />
        </IconStatGrid>

        <SectionHeader title="Recent entries" />
        {rows.length === 0 ? (
          <EmptyState title="No transactions yet" description="MoMo, card, and POS payments will show here." />
        ) : (
          rows.map((row) => (
            <ListRow
              key={row.id}
              icon="card-outline"
              title={row.customer_name ?? row.description ?? row.reference}
              subtitle={`${row.status} · ${row.payment_method || row.source_type} · ${formatWhen(row.occurred_at)}`}
              right={formatMoney(row.amount_cents, row.currency || CURRENCY)}
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
