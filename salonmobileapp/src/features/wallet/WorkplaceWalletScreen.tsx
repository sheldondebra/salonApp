import { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { formatMoney } from "@/booking/format";
import { fetchWallet, fetchWalletTransactions } from "@/wallet/api";
import { WALLET_TX_TYPE_LABELS, type TenantWallet, type TenantWalletTransaction } from "@/wallet/types";
import { colors, spacing } from "@/theme/colors";

export function WorkplaceWalletScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [wallet, setWallet] = useState<TenantWallet | null>(null);
  const [transactions, setTransactions] = useState<TenantWalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!auth) return;
    const [w, tx] = await Promise.all([fetchWallet(auth), fetchWalletTransactions(auth, 1, useSplitLayout ? 50 : 15)]);
    setWallet(w);
    setTransactions(tx.data ?? []);
  }, [auth, useSplitLayout]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading) {
    return <LoadingState message="Loading wallet…" />;
  }

  const currency = wallet?.currency ?? "GHS";

  const cards = wallet ? (
    <IconStatGrid>
      <IconStatCard icon="wallet-outline" label="Available" value={formatMoney(wallet.available_balance, currency)} tint="#059669" />
      <IconStatCard icon="time-outline" label="Pending" value={formatMoney(wallet.pending_balance, currency)} />
      <IconStatCard icon="trending-up-outline" label="Collected" value={formatMoney(wallet.total_collected, currency)} />
      <IconStatCard icon="receipt-outline" label="Fees" value={formatMoney(wallet.total_fees, currency)} />
      <IconStatCard icon="cash-outline" label="Settled" value={formatMoney(wallet.total_settled, currency)} />
    </IconStatGrid>
  ) : null;

  const txList = (
    <View style={styles.txSection}>
      <Text style={styles.sectionTitle}>Recent transactions</Text>
      {transactions.length === 0 ? (
        <EmptyState title="No transactions yet" description="Successful MoMo payments will appear in your wallet ledger." />
      ) : (
        transactions.map((tx) => (
          <ListRow
            key={tx.id}
            icon={tx.direction === "credit" ? "arrow-down-circle-outline" : "arrow-up-circle-outline"}
            title={WALLET_TX_TYPE_LABELS[tx.type] ?? tx.type}
            subtitle={[tx.reference, tx.description].filter(Boolean).join(" · ") || tx.direction}
            right={formatMoney(tx.amount, currency)}
          />
        ))
      )}
    </View>
  );

  const payoutBtn = (
    <Button
      label="Request payout"
      variant="secondary"
      onPress={() =>
        Alert.alert(
          "Coming soon",
          "Payout requests will be available once settlement processing is enabled."
        )
      }
    />
  );

  return (
    <ResponsiveShell scroll={false}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load().finally(() => setRefreshing(false));
            }}
          />
        }
        contentContainerStyle={styles.scroll}
      >
        {useSplitLayout ? (
          <ScreenHeader title="Schedelux Wallet" subtitle="Platform collections" onRefresh={() => void load()} onSignOut={() => void logout()} />
        ) : (
          <Header title="Schedelux Wallet" subtitle="Platform collections — not your personal MoMo balance" />
        )}

        <Text style={styles.hint}>
          This wallet reflects payments collected through Schedelux, not your personal MTN MoMo balance.
        </Text>

        {useSplitLayout ? (
          <View style={styles.split}>
            <View style={styles.leftPane}>
              {cards}
              {payoutBtn}
            </View>
            <View style={styles.rightPane}>{txList}</View>
          </View>
        ) : (
          <>
            {cards}
            {payoutBtn}
            {txList}
          </>
        )}
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl, gap: spacing.md },
  hint: { fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
  split: { flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" },
  leftPane: { flex: 1, minWidth: 280, gap: spacing.md },
  rightPane: { flex: 1.2, minWidth: 300 },
  txSection: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.mutedForeground,
  },
});
