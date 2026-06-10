import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { formatMoney } from "@/booking/format";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { fetchFinancePrepaidBalances, lookupPrepaidBalance } from "@/finance/api";
import type { FinancePrepaidBalancesResponse } from "@/finance/types";
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

export function FinancePrepaidBalancesScreen() {
  const auth = useTenantAuth();
  const [data, setData] = useState<FinancePrepaidBalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lookupCode, setLookupCode] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      setData(
        await fetchFinancePrepaidBalances(auth, {
          from: defaultFromDate(),
          to: defaultToDate(),
        })
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load prepaid balances");
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

  async function onLookup() {
    if (!auth || !lookupCode.trim()) return;
    setLookupMessage("");
    try {
      const result = await lookupPrepaidBalance(auth, { type: "gift_card", code: lookupCode.trim() });
      if (result.gift_card) {
        setLookupMessage(
          `${result.gift_card.code}: ${formatMoney(result.gift_card.balance_cents, CURRENCY)} (${result.gift_card.status})`
        );
      }
    } catch (err) {
      setLookupMessage(err instanceof ApiError ? err.message : "Gift card not found");
    }
  }

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading && !data) {
    return <LoadingState message="Loading prepaid balances…" />;
  }

  const summary = data?.summary;

  return (
    <ResponsiveShell>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <ScreenHeader
          title="Prepaid balances"
          subtitle="Gift cards, packages, and membership liabilities"
        />

        {error ? (
          <Card>
            <Text style={styles.error}>{error}</Text>
          </Card>
        ) : null}

        <IconStatGrid>
          <IconStatCard
            icon="card-outline"
            label="Gift card liability"
            value={formatMoney(summary?.gift_card_liability_cents ?? 0, CURRENCY)}
            hint={`${summary?.gift_card_active_count ?? 0} active`}
            tint="#7C3AED"
          />
          <IconStatCard
            icon="gift-outline"
            label="Package liability"
            value={formatMoney(summary?.package_liability_cents ?? 0, CURRENCY)}
            hint={`${summary?.package_active_count ?? 0} active`}
            tint="#059669"
          />
          <IconStatCard
            icon="people-outline"
            label="Membership revenue"
            value={formatMoney(summary?.membership_revenue_cents ?? 0, CURRENCY)}
            hint={`${summary?.active_memberships_count ?? 0} active`}
            tint="#0EA5E9"
          />
          <IconStatCard
            icon="repeat-outline"
            label="Total liability"
            value={formatMoney(summary?.total_prepaid_liability_cents ?? 0, CURRENCY)}
            hint="Gift cards + packages"
            tint="#D97706"
          />
        </IconStatGrid>

        <SectionHeader title="Gift card lookup" />
        <Card>
          <TextInput
            value={lookupCode}
            onChangeText={setLookupCode}
            placeholder="Enter gift card code"
            autoCapitalize="characters"
            style={styles.input}
          />
          <Button label="Look up balance" onPress={() => void onLookup()} />
          {lookupMessage ? <Text style={styles.lookup}>{lookupMessage}</Text> : null}
        </Card>

        <SectionHeader title="Active gift cards" />
        {(data?.active_gift_cards ?? []).length === 0 ? (
          <EmptyState title="No active gift cards" description="Sold gift cards with balance will appear here." />
        ) : (
          (data?.active_gift_cards ?? []).slice(0, 10).map((row) => (
            <ListRow
              key={row.uuid}
              icon="card-outline"
              title={row.code}
              subtitle={row.status}
              right={formatMoney(row.balance_cents, CURRENCY)}
            />
          ))
        )}

        <SectionHeader title="Active packages" />
        {(data?.active_packages ?? []).length === 0 ? (
          <EmptyState title="No active packages" description="Client package credits will appear here." />
        ) : (
          (data?.active_packages ?? []).slice(0, 10).map((row) => (
            <ListRow
              key={row.uuid}
              icon="gift-outline"
              title={row.package_name ?? "Package"}
              subtitle={`${row.sessions_remaining}/${row.sessions_total} sessions · ${row.client_name ?? "Client"}`}
              right={formatMoney(row.liability_cents, CURRENCY)}
            />
          ))
        )}

        <SectionHeader title="Recent redemptions" />
        {(data?.recent_redemptions ?? []).length === 0 ? (
          <EmptyState title="No redemptions" description="Gift card and package usage in the last 30 days." />
        ) : (
          (data?.recent_redemptions ?? []).slice(0, 12).map((row, index) => (
            <ListRow
              key={`${row.type}-${row.label}-${index}`}
              icon={row.type === "gift_card" ? "card-outline" : "gift-outline"}
              title={row.label}
              subtitle={row.type.replace("_", " ")}
              right={
                row.type === "gift_card"
                  ? formatMoney(row.amount_cents ?? 0, CURRENCY)
                  : `${row.sessions_used ?? 0} session(s)`
              }
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: 16,
    color: colors.foreground,
  },
  lookup: { marginTop: spacing.sm, fontSize: 14, color: colors.foreground, fontWeight: "600" },
});
