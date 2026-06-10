import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatMoney } from "@/booking/format";
import { fetchFinanceInvoices, type TenantInvoiceSummary } from "@/finance/api";
import { colors, radii, spacing } from "@/theme/colors";

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function FinanceInvoicesScreen() {
  const router = useRouter();
  const auth = useTenantAuth();
  const [rows, setRows] = useState<TenantInvoiceSummary[]>([]);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const res = await fetchFinanceInvoices(auth, { q: debouncedQuery.trim() || undefined });
      setRows(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load invoices");
      setRows([]);
    }
  }, [auth, debouncedQuery]);

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

  return (
    <ResponsiveShell>
      <ScreenHeader title="Invoices" subtitle="Bill clients and track what is still owed" />
      <Button label="New invoice" onPress={() => router.push("/workplace/finance/invoices/new" as never)} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.search}
          placeholder="Search invoice or client…"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />

        {loading && rows.length === 0 ? <LoadingState message="Loading invoices…" /> : null}
        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        {!loading && rows.length === 0 && !error ? (
          <EmptyState
            title="No invoices yet"
            description="Tap New to create your first invoice and request payment."
          />
        ) : null}

        {rows.map((row) => (
          <Pressable key={row.id} onPress={() => router.push(`/workplace/finance/invoices/${row.id}` as never)}>
            <Card style={styles.card}>
              <ListRow
                title={row.invoice_number}
                subtitle={`${row.customer?.name ?? "Walk-in"} · ${statusLabel(row.status)}`}
                right={`${formatMoney(row.total_cents, row.currency)}${row.balance_due_cents > 0 ? `\nDue ${formatMoney(row.balance_due_cents, row.currency)}` : ""}`}
              />
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing["2xl"], gap: spacing.sm },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.foreground,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  card: { marginBottom: spacing.xs },
  errorCard: { padding: spacing.md },
  errorText: { color: colors.destructive },
});
