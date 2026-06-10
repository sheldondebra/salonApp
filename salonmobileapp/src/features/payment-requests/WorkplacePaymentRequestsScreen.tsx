import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PaymentRequestDetailPanel } from "@/features/payment-requests/PaymentRequestDetailPanel";
import { CreatePaymentRequestScreen } from "@/features/payment-requests/CreatePaymentRequestScreen";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { fetchPaymentRequest, fetchPaymentRequests } from "@/payment-requests/api";
import {
  PAYMENT_REQUEST_REASON_LABELS,
  PAYMENT_REQUEST_STATUS_LABELS,
  type PaymentRequest,
} from "@/payment-requests/types";
import { formatMoney } from "@/booking/format";
import { colors, radii, spacing } from "@/theme/colors";

const STATUS_FILTERS = ["all", "pending", "processing", "success", "failed"] as const;

export function WorkplacePaymentRequestsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [items, setItems] = useState<PaymentRequest[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<PaymentRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(
    async (force = false) => {
      if (!auth) return;
      setError("");
      try {
        const res = await fetchPaymentRequests(auth, {
          per_page: 50,
          status: statusFilter === "all" ? undefined : statusFilter,
        });
        const rows = res.data ?? [];
        setItems(rows);
        setSummary(res.meta?.summary ?? {});
        if (useSplitLayout && rows.length > 0) {
          setSelected((prev) => {
            if (prev && rows.some((r) => r.id === prev.id) && !force) return prev;
            return rows[0];
          });
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load payment requests");
        setItems([]);
      }
    },
    [auth, statusFilter, useSplitLayout]
  );

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  async function openDetail(row: PaymentRequest) {
    if (!auth) return;
    if (useSplitLayout) {
      setCreating(false);
      try {
        const detail = await fetchPaymentRequest(auth, row.id);
        setSelected(detail);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load details");
      }
      return;
    }
    router.push(`/workplace/payment-requests/${row.id}` as never);
  }

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading) {
    return <LoadingState message="Loading MoMo requests…" />;
  }

  const listPane = (
    <View style={[styles.listPane, useSplitLayout && styles.listPaneSplit]}>
      {summary ? (
        <IconStatGrid>
          <IconStatCard icon="time-outline" label="Pending" value={String(summary.pending ?? 0)} />
          <IconStatCard icon="sync-outline" label="Processing" value={String(summary.processing ?? 0)} />
          <IconStatCard icon="checkmark-circle-outline" label="Paid" value={String(summary.success ?? 0)} tint="#059669" />
          <IconStatCard icon="close-circle-outline" label="Failed" value={String(summary.failed ?? 0)} tint={colors.destructive} />
        </IconStatGrid>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setStatusFilter(f)}
            style={[styles.chip, statusFilter === f && styles.chipActive]}
          >
            <Text style={[styles.chipText, statusFilter === f && styles.chipTextActive]}>
              {f === "all" ? "All" : PAYMENT_REQUEST_STATUS_LABELS[f as keyof typeof PAYMENT_REQUEST_STATUS_LABELS] ?? f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {items.length === 0 ? (
        <EmptyState
          title="No payment requests"
          description="Admin-initiated MoMo requests will appear here with status updates."
        />
      ) : (
        items.map((row) => (
          <ListRow
            key={row.id}
            icon="phone-portrait-outline"
            title={row.customer?.name ?? row.phone}
            subtitle={[
              PAYMENT_REQUEST_REASON_LABELS[row.reason] ?? row.reason,
              row.gateway,
              formatMoney(row.amount_cents, row.currency),
            ].join(" · ")}
            right={PAYMENT_REQUEST_STATUS_LABELS[row.status] ?? row.status}
            onPress={() => void openDetail(row)}
          />
        ))
      )}
    </View>
  );

  const detailPane =
    useSplitLayout && selected ? (
      <View style={styles.detailPane}>
        <PaymentRequestDetailPanel request={selected} />
      </View>
    ) : useSplitLayout ? (
      <View style={styles.detailPane}>
        <EmptyState title="Select a request" description="Choose a MoMo payment request from the list." />
      </View>
    ) : null;

  return (
    <ResponsiveShell scroll={false} style={styles.shell}>
      <View style={styles.body}>
        <ScrollView
          style={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load(true).finally(() => setRefreshing(false));
              }}
            />
          }
          contentContainerStyle={useSplitLayout ? styles.splitScroll : undefined}
        >
          <ScreenHeader
            title="MoMo requests"
            subtitle={`${summary.pending ?? 0} pending`}
            onRefresh={() => void load(true)}
            onSignOut={() => void logout()}
          />

          {useSplitLayout ? (
            <Button
              label={creating ? "Cancel new request" : "New payment request"}
              variant={creating ? "secondary" : "primary"}
              onPress={() => setCreating((v) => !v)}
              style={styles.newBtn}
            />
          ) : (
            <Button
              label="New payment request"
              onPress={() => router.push("/workplace/payment-requests/new" as never)}
              style={styles.newBtn}
            />
          )}

          {useSplitLayout ? (
            <View style={styles.split}>
              {listPane}
              {creating ? (
                <View style={styles.detailPane}>
                  <CreatePaymentRequestScreen embedded onDone={() => { setCreating(false); void load(true); }} />
                </View>
              ) : (
                detailPane
              )}
            </View>
          ) : (
            listPane
          )}
        </ScrollView>
      </View>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { flex: 1 },
  scroll: { flex: 1 },
  splitScroll: { flexGrow: 1 },
  newBtn: { marginBottom: spacing.sm },
  split: { flexDirection: "row", gap: spacing.lg, minHeight: 480, alignItems: "flex-start" },
  listPane: { gap: spacing.md },
  listPaneSplit: { flex: 1, minWidth: 280, maxWidth: 420 },
  detailPane: {
    flex: 1,
    minWidth: 300,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  filters: { marginBottom: spacing.xs },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  chipTextActive: { color: colors.primaryForeground },
  error: { color: colors.destructive, fontSize: 14 },
});
