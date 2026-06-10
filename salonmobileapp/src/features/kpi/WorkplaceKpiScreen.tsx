import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
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
  formatDateLabel,
  formatPercent,
  sharedStyles,
} from "@/features/workplace/WorkplacePart2Ui";
import { createKpiTarget, fetchKpiDashboard, type KpiDashboard } from "@/workplace/api";
import { colors, spacing } from "@/theme/colors";

const KPI_METRICS = ["revenue", "bookings", "retail_sales", "staff_sales"] as const;
const KPI_PERIODS = ["weekly", "monthly", "quarterly"] as const;

export function WorkplaceKpiScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();

  const [dashboard, setDashboard] = useState<KpiDashboard | null>(null);
  const [metric, setMetric] = useState<(typeof KPI_METRICS)[number]>("revenue");
  const [period, setPeriod] = useState<(typeof KPI_PERIODS)[number]>("monthly");
  const [targetValue, setTargetValue] = useState("100");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      setDashboard(await fetchKpiDashboard(auth));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load KPI dashboard");
      setDashboard({ summary: {}, targets: [] });
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const progressCards = useMemo(
    () => [
      {
        label: "Revenue",
        value: dashboard?.summary.revenue_target_progress ?? 0,
        tint: "#10B981",
      },
      {
        label: "Bookings",
        value: dashboard?.summary.bookings_target_progress ?? 0,
        tint: "#3B82F6",
      },
      {
        label: "Retail",
        value: dashboard?.summary.retail_target_progress ?? 0,
        tint: "#F59E0B",
      },
      {
        label: "Staff",
        value: dashboard?.summary.staff_target_progress ?? 0,
        tint: "#8B5CF6",
      },
    ],
    [dashboard]
  );

  async function handleCreateTarget() {
    if (!auth) return;
    const parsedValue = Math.max(0, Number.parseInt(targetValue || "0", 10));
    if (parsedValue <= 0) {
      setError("Enter a target value greater than zero.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await createKpiTarget(auth, {
        metric,
        period,
        target_value: parsedValue,
      });
      Alert.alert("Target saved", "The KPI target was added successfully.");
      setTargetValue("100");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save KPI target");
    } finally {
      setSubmitting(false);
    }
  }

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
        <LoadingState message="Loading KPI dashboard…" />
      </ResponsiveShell>
    );
  }

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="KPI targets"
        subtitle="Track revenue, bookings, retail, and staff goals"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      <IconStatGrid>
        {progressCards.map((card) => (
          <IconStatCard
            key={card.label}
            icon="speedometer-outline"
            label={card.label}
            value={formatPercent(card.value)}
            tint={card.tint}
          />
        ))}
      </IconStatGrid>

      <View style={styles.grid}>
        <View style={styles.leftColumn}>
          <StepFlowCard
            title="Set KPI target"
            description="Quick mobile target entry for managers updating their progress goals."
            steps={[
              "Choose the KPI metric you want to track.",
              "Select the reporting period and enter the target value.",
              "Save the target so progress appears on the KPI dashboard.",
            ]}
          >
            <SectionTitle title="Metric" />
            <View style={sharedStyles.rowWrap}>
              {KPI_METRICS.map((item) => (
                <SelectChip
                  key={item}
                  label={item.replace(/_/g, " ")}
                  selected={item === metric}
                  onPress={() => setMetric(item)}
                />
              ))}
            </View>
            <SectionTitle title="Period" />
            <View style={sharedStyles.rowWrap}>
              {KPI_PERIODS.map((item) => (
                <SelectChip
                  key={item}
                  label={item}
                  selected={item === period}
                  onPress={() => setPeriod(item)}
                />
              ))}
            </View>
            <Input
              label="Target value"
              value={targetValue}
              keyboardType="number-pad"
              onChangeText={setTargetValue}
            />
            {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
            <Button
              label={submitting ? "Saving…" : "Save KPI target"}
              onPress={() => void handleCreateTarget()}
              loading={submitting}
            />
          </StepFlowCard>
        </View>

        <View style={styles.rightColumn}>
          <Card style={styles.card}>
            <SectionTitle title="Progress" subtitle="Current completion against active targets" />
            <View style={styles.metricsList}>
              {progressCards.map((card) => (
                <MetricBar
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  tint={card.tint}
                  subtitle="Progress updates rely on the linked analytics pipeline."
                />
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <SectionTitle title="Active targets" subtitle={`${dashboard?.targets.length ?? 0} saved KPI goals`} />
            {dashboard?.targets.length ? (
              dashboard.targets.map((target) => (
                <ListRow
                  key={target.id}
                  icon="flag-outline"
                  title={target.metric.replace(/_/g, " ")}
                  subtitle={`Period ${target.period} · ${formatDateLabel(target.period_start)} to ${formatDateLabel(
                    target.period_end
                  )}`}
                  right={formatPercent(target.progress_percent ?? 0)}
                />
              ))
            ) : (
              <EmptyState title="No KPI targets yet" description="Add your first target from the form on this screen." />
            )}
          </Card>
        </View>
      </View>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.md },
  leftColumn: { gap: spacing.md },
  rightColumn: { gap: spacing.md },
  card: { gap: spacing.md },
  metricsList: { gap: spacing.sm },
});
