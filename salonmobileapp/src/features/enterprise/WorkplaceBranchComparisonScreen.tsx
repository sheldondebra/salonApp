import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { formatMoney } from "@/booking/format";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SimpleBarChart } from "@/components/ui/SimpleBarChart";
import { DetailCard, StatusPill, part3Styles } from "@/features/part3/Part3Shared";
import {
  SectionTitle,
  SelectChip,
  formatPercent,
  sharedStyles,
} from "@/features/workplace/WorkplacePart2Ui";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  fetchBranchComparison,
  type BranchComparisonBranch,
  type BranchComparisonDashboard,
} from "@/workplace/api";

const RANGES = ["30d", "90d", "year"] as const;

const FALLBACK_REPORT: BranchComparisonDashboard = {
  summary: {
    branches: 4,
    revenue_cents: 6284000,
    bookings: 421,
    average_staff_score: 84,
  },
  branches: [
    {
      id: 1,
      name: "Downtown",
      revenue_cents: 1985000,
      bookings: 132,
      staff_score: 92,
      service_score: 88,
      change_percent: 12,
      rank: 1,
    },
    {
      id: 2,
      name: "Airport",
      revenue_cents: 1712000,
      bookings: 118,
      staff_score: 85,
      service_score: 81,
      change_percent: 7,
      rank: 2,
    },
    {
      id: 3,
      name: "Hillside",
      revenue_cents: 1424000,
      bookings: 94,
      staff_score: 79,
      service_score: 76,
      change_percent: -3,
      rank: 3,
    },
    {
      id: 4,
      name: "Seaside",
      revenue_cents: 1163000,
      bookings: 77,
      staff_score: 80,
      service_score: 78,
      change_percent: 2,
      rank: 4,
    },
  ],
};

export function WorkplaceBranchComparisonScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [range, setRange] = useState<(typeof RANGES)[number]>("90d");
  const [report, setReport] = useState<BranchComparisonDashboard | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const next = await fetchBranchComparison(auth, { range });
      setReport(next);
      setSelectedBranchId((current) => current ?? next.branches[0]?.id ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.message}. Showing preview data.` : "Could not load branch comparison."
      );
      setReport(FALLBACK_REPORT);
      setSelectedBranchId((current) => current ?? FALLBACK_REPORT.branches[0]?.id ?? null);
    }
  }, [auth, range]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const branches = report?.branches ?? [];
  const selectedBranch = useMemo<BranchComparisonBranch | null>(
    () => branches.find((branch) => branch.id === selectedBranchId) ?? branches[0] ?? null,
    [branches, selectedBranchId]
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
        <LoadingState message="Loading branch comparison…" />
      </ResponsiveShell>
    );
  }

  const listPane = (
    <View style={sharedStyles.listPane}>
      <SectionTitle title="Branches" subtitle="Revenue, bookings, and service performance by location." />
      {branches.map((branch) => {
        const selected = branch.id === selectedBranch?.id;
        return (
          <Pressable
            key={branch.id}
            onPress={() => setSelectedBranchId(branch.id)}
            style={[part3Styles.listCard, selected && part3Styles.listCardSelected]}
          >
            <Text style={part3Styles.cardTitle}>{branch.name}</Text>
            <Text style={part3Styles.cardMeta}>
              {formatMoney(branch.revenue_cents)} revenue · {branch.bookings} bookings
            </Text>
            <View style={styles.inlineRow}>
              <StatusPill label={`Rank ${branch.rank ?? "—"}`} tone="info" />
              <StatusPill
                label={`${branch.change_percent ?? 0}%`}
                tone={(branch.change_percent ?? 0) >= 0 ? "success" : "warning"}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const detailPane = (
    <View style={sharedStyles.detailPane}>
      <DetailCard
        title={selectedBranch?.name ?? "Branch detail"}
        subtitle="Branch comparison is optimized for tablet split view so managers can tap a location and review the detail pane beside the ranking list."
      >
        {selectedBranch ? (
          <View style={styles.inlineRow}>
            <StatusPill label={`${formatMoney(selectedBranch.revenue_cents)} revenue`} tone="success" />
            <StatusPill label={`${selectedBranch.bookings} bookings`} tone="info" />
            <StatusPill label={`${formatPercent(selectedBranch.staff_score)} staff score`} tone="neutral" />
          </View>
        ) : null}
      </DetailCard>

      <SimpleBarChart
        title="Revenue ranking"
        data={branches.map((branch) => ({ label: branch.name, value: branch.revenue_cents / 100 }))}
        formatValue={(value) => formatMoney(value * 100)}
        accentColor="#8B5CF6"
      />

      <SimpleBarChart
        title="Booking volume"
        data={branches.map((branch) => ({ label: branch.name, value: branch.bookings }))}
        formatValue={(value) => `${Math.round(value)}`}
        accentColor="#F59E0B"
      />

      <DetailCard
        title="Score breakdown"
        subtitle="Use the score cards below to spot branches that need support with service execution or staff productivity."
      >
        {selectedBranch ? (
          <View style={part3Styles.stack}>
            <ListRow
              icon="people-outline"
              title="Staff performance"
              subtitle="Sales pace, utilization, and attendance trend"
              right={formatPercent(selectedBranch.staff_score)}
            />
            <ListRow
              icon="sparkles-outline"
              title="Service performance"
              subtitle="Booking mix, completion quality, and repeat demand"
              right={formatPercent(selectedBranch.service_score)}
            />
            <ListRow
              icon="trending-up-outline"
              title="Period change"
              subtitle="Compared with the previous reporting window"
              right={`${selectedBranch.change_percent ?? 0}%`}
            />
          </View>
        ) : (
          <EmptyState title="No branch selected" description="Pick a branch from the list to compare its metrics." />
        )}
      </DetailCard>
    </View>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Branch comparison"
        subtitle="Multi-location revenue and booking benchmarking"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      <View style={sharedStyles.rowWrap}>
        {RANGES.map((item) => (
          <SelectChip key={item} label={item} selected={item === range} onPress={() => setRange(item)} />
        ))}
      </View>
      {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
      <IconStatGrid>
        <IconStatCard icon="business-outline" label="Branches" value={String(report?.summary.branches ?? 0)} />
        <IconStatCard
          icon="cash-outline"
          label="Revenue"
          value={formatMoney(report?.summary.revenue_cents ?? 0)}
        />
        <IconStatCard
          icon="calendar-outline"
          label="Bookings"
          value={String(report?.summary.bookings ?? 0)}
        />
        <IconStatCard
          icon="speedometer-outline"
          label="Avg staff score"
          value={formatPercent(report?.summary.average_staff_score ?? 0)}
        />
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
  inlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
