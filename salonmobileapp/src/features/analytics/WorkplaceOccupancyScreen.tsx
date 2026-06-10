import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import {
  MetricBar,
  SectionTitle,
  SelectChip,
  StepFlowCard,
  formatPercent,
  sharedStyles,
} from "@/features/workplace/WorkplacePart2Ui";
import { fetchOccupancyReport, type OccupancyReport } from "@/workplace/api";
import { spacing } from "@/theme/colors";

const RANGES = ["7d", "30d", "90d"] as const;

export function WorkplaceOccupancyScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();

  const [range, setRange] = useState<(typeof RANGES)[number]>("30d");
  const [report, setReport] = useState<OccupancyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      setReport(await fetchOccupancyReport(auth, { range }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load occupancy analytics");
      setReport(null);
    }
  }, [auth, range]);

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
    return (
      <ResponsiveShell>
        <LoadingState message="Loading occupancy analytics…" />
      </ResponsiveShell>
    );
  }

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Occupancy"
        subtitle="Staff utilization, room occupancy, and peak-time placeholders"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />

      <View style={sharedStyles.rowWrap}>
        {RANGES.map((item) => (
          <SelectChip key={item} label={item} selected={item === range} onPress={() => setRange(item)} />
        ))}
      </View>

      {report ? (
        <>
          <IconStatGrid>
            <IconStatCard
              icon="analytics-outline"
              label="Utilization"
              value={formatPercent(report.summary.utilization_percent)}
            />
            <IconStatCard
              icon="business-outline"
              label="Occupancy"
              value={formatPercent(report.summary.occupancy_percent)}
            />
            <IconStatCard
              icon="time-outline"
              label="Booked hours"
              value={String(report.summary.booked_hours)}
            />
            <IconStatCard
              icon="sunny-outline"
              label="Peak time"
              value={report.summary.peak_time_label || "TBD"}
            />
          </IconStatGrid>

          <StepFlowCard
            title="How to use this dashboard"
            description="Occupancy highlights where you can stretch staff, chairs, or rooms across the week."
            steps={[
              "Choose the date range you want to review.",
              "Compare utilization by staff and occupancy by room or chair.",
              "Use the peak-time placeholder to plan schedules and capacity changes.",
            ]}
          />

          <View style={styles.grid}>
            <View style={styles.column}>
              <SectionTitle title="Staff utilization" subtitle="Available vs booked hours by team member" />
              {report.by_staff.length ? (
                report.by_staff.map((item) => (
                  <MetricBar
                    key={item.label}
                    label={item.label}
                    value={item.utilization_percent}
                    subtitle={`${item.booked_hours} booked of ${item.available_hours} available hours`}
                    tint="#3B82F6"
                  />
                ))
              ) : (
                <EmptyState title="No staff utilization data" description="Utilization rows will appear once analytics are available." />
              )}
            </View>

            <View style={styles.column}>
              <SectionTitle title="Room or chair occupancy" subtitle="Usage by physical space" />
              {report.by_room.length ? (
                report.by_room.map((item) => (
                  <MetricBar
                    key={item.label}
                    label={item.label}
                    value={item.occupancy_percent}
                    subtitle={`${item.booked_hours} booked of ${item.available_hours} available hours`}
                    tint="#10B981"
                  />
                ))
              ) : (
                <EmptyState title="No occupancy rows yet" description="Room or chair data will appear once the analytics endpoint is ready." />
              )}
            </View>
          </View>

          <View style={styles.column}>
            <SectionTitle title="Heatmap placeholder" subtitle="Reserved space for the future peak-time heatmap" />
            <ListRow
              icon="grid-outline"
              title="Peak-time heatmap"
              subtitle="A visual hour-by-hour occupancy heatmap is intentionally left as a placeholder in this batch."
              right="Soon"
            />
          </View>
        </>
      ) : (
        <EmptyState title="Occupancy analytics unavailable" description={error || "No occupancy data was returned."} />
      )}
      {error && report ? <Text style={sharedStyles.error}>{error}</Text> : null}
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.md },
  column: { gap: spacing.sm },
});
