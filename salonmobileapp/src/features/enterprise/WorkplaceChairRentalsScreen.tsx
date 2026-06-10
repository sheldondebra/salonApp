import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { formatMoney } from "@/booking/format";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SimpleBarChart } from "@/components/ui/SimpleBarChart";
import { DetailCard, StatusPill, part3Styles } from "@/features/part3/Part3Shared";
import { SectionTitle, sharedStyles } from "@/features/workplace/WorkplacePart2Ui";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  fetchChairRentalDashboard,
  type ChairRentalDashboard,
  type ChairRentalRenter,
} from "@/workplace/api";

const FALLBACK_DASHBOARD: ChairRentalDashboard = {
  summary: {
    active_renters: 6,
    occupied_chairs: 8,
    revenue_cents: 486000,
    overdue_invoices: 1,
  },
  renters: [
    {
      id: 1,
      chair_name: "Booth A1",
      renter_name: "Adjoa",
      status: "active",
      weekly_fee_cents: 85000,
      next_invoice_due: new Date().toISOString(),
      payout_mode: "self-employed",
      days_booked: 6,
    },
    {
      id: 2,
      chair_name: "Nail Pod 2",
      renter_name: "Favour",
      status: "invoice due",
      weekly_fee_cents: 72000,
      next_invoice_due: new Date().toISOString(),
      payout_mode: "chair rental",
      days_booked: 5,
    },
  ],
  schedule: [
    { day: "Mon", occupied: 5, total: 8 },
    { day: "Tue", occupied: 6, total: 8 },
    { day: "Wed", occupied: 7, total: 8 },
    { day: "Thu", occupied: 6, total: 8 },
    { day: "Fri", occupied: 8, total: 8 },
  ],
};

export function WorkplaceChairRentalsScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [dashboard, setDashboard] = useState<ChairRentalDashboard | null>(null);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const next = await fetchChairRentalDashboard(auth);
      setDashboard(next);
      setSelectedId((current) => current ?? next.renters[0]?.id ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.message}. Showing preview rental data.` : "Could not load chair rentals."
      );
      setDashboard(FALLBACK_DASHBOARD);
      setSelectedId((current) => current ?? FALLBACK_DASHBOARD.renters[0]?.id ?? null);
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const renters = dashboard?.renters ?? [];
  const selected = useMemo<ChairRentalRenter | null>(
    () => renters.find((renter) => renter.id === selectedId) ?? renters[0] ?? null,
    [renters, selectedId]
  );

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading) {
    return (
      <ResponsiveShell>
        <LoadingState message="Loading chair rentals…" />
      </ResponsiveShell>
    );
  }

  const listPane = (
    <View style={sharedStyles.listPane}>
      <SectionTitle title="Rental roster" subtitle="Independent staff, pods, and booth occupancy." />
      {renters.map((renter) => {
        const isSelected = renter.id === selected?.id;
        return (
          <Pressable
            key={renter.id}
            onPress={() => setSelectedId(renter.id)}
            style={[part3Styles.listCard, isSelected && part3Styles.listCardSelected]}
          >
            <Text style={part3Styles.cardTitle}>{renter.renter_name}</Text>
            <Text style={part3Styles.cardMeta}>{renter.chair_name}</Text>
            <View style={styles.pillRow}>
              <StatusPill label={renter.status} tone={renter.status === "active" ? "success" : "warning"} />
              <StatusPill label={`${renter.days_booked} days`} tone="info" />
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const detailPane = (
    <View style={sharedStyles.detailPane}>
      <DetailCard
        title={selected?.renter_name ?? "Select a renter"}
        subtitle={selected ? `${selected.chair_name} · ${selected.payout_mode || "rental profile"}` : "Choose a renter from the list."}
      >
        {selected ? (
          <View style={part3Styles.stack}>
            <ListRow
              icon="cash-outline"
              title="Weekly fee"
              subtitle="Current rent or booth charge"
              right={formatMoney(selected.weekly_fee_cents)}
            />
            <ListRow
              icon="calendar-outline"
              title="Next invoice"
              subtitle="Upcoming due date for rent or booth payment"
              right={selected.next_invoice_due ? new Date(selected.next_invoice_due).toLocaleDateString() : "—"}
            />
            <Button
              label="Open payout setup"
              variant="secondary"
              onPress={() =>
                Alert.alert(
                  "Payout placeholder",
                  "Independent staff payout setup is reserved for the self-employed staff flow in the finance web workspace."
                )
              }
            />
          </View>
        ) : (
          <EmptyState title="No renter selected" description="Tap a renter to inspect their fee and schedule profile." />
        )}
      </DetailCard>

      <SimpleBarChart
        title="Weekly occupancy"
        data={(dashboard?.schedule ?? []).map((item) => ({ label: item.day, value: item.occupied }))}
        formatValue={(value) => `${Math.round(value)} chairs`}
        accentColor="#10B981"
      />
    </View>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Chair rentals"
        subtitle="Booth occupancy, renter status, and revenue overview"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
      <IconStatGrid>
        <IconStatCard icon="person-outline" label="Active renters" value={String(dashboard?.summary.active_renters ?? 0)} />
        <IconStatCard icon="business-outline" label="Occupied chairs" value={String(dashboard?.summary.occupied_chairs ?? 0)} />
        <IconStatCard icon="cash-outline" label="Rent revenue" value={formatMoney(dashboard?.summary.revenue_cents ?? 0)} />
        <IconStatCard icon="alert-circle-outline" label="Overdue" value={String(dashboard?.summary.overdue_invoices ?? 0)} />
      </IconStatGrid>
      {useSplitLayout ? (
        <View style={sharedStyles.split}>
          {listPane}
          {detailPane}
        </View>
      ) : (
        <>
          {listPane}
          {detailPane}
        </>
      )}
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
