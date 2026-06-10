import { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { formatMoney } from "@/booking/format";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useTenantAbilities } from "@/hooks/useTenantAbilities";
import {
  closeCashDrawer,
  fetchActiveCashDrawer,
  openCashDrawer,
} from "@/finance/api";
import type { CashDrawerSession } from "@/finance/types";
import { fetchPosLocations } from "@/pos/api";
import type { PosLocation } from "@/pos/types";
import { colors, radii, spacing } from "@/theme/colors";

const CURRENCY = "GHS";

function toCents(value: string): number {
  return Math.max(0, Math.round((parseFloat(value) || 0) * 100));
}

export function FinanceReconciliationScreen() {
  const auth = useTenantAuth();
  const { can } = useTenantAbilities();
  const canManage = can("pos.create") || can("finance.reconciliation.manage");

  const [locations, setLocations] = useState<PosLocation[]>([]);
  const [locationId, setLocationId] = useState("");
  const [active, setActive] = useState<CashDrawerSession | null>(null);
  const [openingCash, setOpeningCash] = useState("0");
  const [countedCash, setCountedCash] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!auth) return;
    try {
      const locs = await fetchPosLocations(auth);
      setLocations(locs);
      const loc = locationId || (locs[0] ? String(locs[0].id) : "");
      if (!locationId && loc) setLocationId(loc);
      if (loc) {
        setActive(await fetchActiveCashDrawer(auth, Number(loc)));
      } else {
        setActive(null);
      }
    } catch {
      setActive(null);
    }
  }, [auth, locationId]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function handleOpen() {
    if (!auth || !locationId) return;
    setActing(true);
    try {
      setActive(
        await openCashDrawer(auth, {
          location_id: Number(locationId),
          opening_cash_cents: toCents(openingCash),
        })
      );
      Alert.alert("Drawer opened", "You can start taking cash sales.");
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Could not open drawer");
    } finally {
      setActing(false);
    }
  }

  async function handleClose() {
    if (!auth || !active) return;
    setActing(true);
    try {
      const closed = await closeCashDrawer(auth, active.uuid, {
        counted_cash_cents: toCents(countedCash),
      });
      setActive(null);
      setCountedCash("");
      const diff = closed.difference_cents ?? 0;
      Alert.alert(
        diff === 0 ? "Balanced" : "Discrepancy",
        diff === 0
          ? "Cash drawer closed and matched expected."
          : `Difference of ${formatMoney(diff, CURRENCY)} recorded.`
      );
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Could not close drawer");
    } finally {
      setActing(false);
    }
  }

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading && !active && locations.length === 0) {
    return <LoadingState message="Loading reconciliation…" />;
  }

  const breakdown = active?.payment_breakdown;

  return (
    <ResponsiveShell>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <ScreenHeader title="End-of-day cash" subtitle="Open and close the register drawer" />

        {locations.length > 1 ? (
          <Card>
            <Text style={styles.label}>Location</Text>
            <View style={styles.chips}>
              {locations.map((loc) => {
                const selected = String(loc.id) === locationId;
                return (
                  <Button
                    key={loc.id}
                    label={loc.name}
                    variant={selected ? "primary" : "secondary"}
                    onPress={() => setLocationId(String(loc.id))}
                    style={styles.chip}
                  />
                );
              })}
            </View>
          </Card>
        ) : null}

        {!active ? (
          <Card>
            <SectionHeader title="Open drawer" />
            <Text style={styles.label}>Opening float ({CURRENCY})</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={openingCash}
              onChangeText={setOpeningCash}
              editable={canManage}
            />
            {canManage ? (
              <Button
                label={acting ? "Opening…" : "Open drawer"}
                onPress={() => void handleOpen()}
                loading={acting}
                disabled={!locationId}
              />
            ) : (
              <Text style={styles.muted}>POS permission required to open the drawer.</Text>
            )}
          </Card>
        ) : (
          <>
            <IconStatGrid>
              <IconStatCard
                icon="cash-outline"
                label="Expected cash"
                value={formatMoney(active.expected_cash_cents, CURRENCY)}
                tint="#059669"
              />
              <IconStatCard
                icon="card-outline"
                label="Cash sales"
                value={formatMoney(breakdown?.cash_cents ?? 0, CURRENCY)}
                hint={`${breakdown?.sale_count ?? 0} sales`}
              />
              <IconStatCard
                icon="phone-portrait-outline"
                label="MoMo"
                value={formatMoney(breakdown?.mobile_money_cents ?? 0, CURRENCY)}
              />
              <IconStatCard
                icon="wallet-outline"
                label="Card"
                value={formatMoney(breakdown?.card_cents ?? 0, CURRENCY)}
              />
            </IconStatGrid>

            <Card>
              <SectionHeader title="Close drawer" />
              <Text style={styles.muted}>
                Float {formatMoney(active.opening_cash_cents, CURRENCY)} · Opened by{" "}
                {active.opened_by?.name ?? "Staff"}
              </Text>
              <Text style={styles.label}>Counted cash ({CURRENCY})</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder={(active.expected_cash_cents / 100).toFixed(2)}
                placeholderTextColor={colors.mutedForeground}
                value={countedCash}
                onChangeText={setCountedCash}
                editable={canManage}
              />
              {canManage ? (
                <Button
                  label={acting ? "Closing…" : "Close & reconcile"}
                  onPress={() => void handleClose()}
                  loading={acting}
                  disabled={!countedCash.trim()}
                />
              ) : null}
            </Card>
          </>
        )}
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing["3xl"], gap: spacing.md },
  label: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground, marginBottom: 6 },
  muted: { fontSize: 14, color: colors.muted, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.black,
    marginBottom: spacing.md,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { flexGrow: 0 },
});
