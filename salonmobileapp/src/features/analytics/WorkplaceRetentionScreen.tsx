import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
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
import {
  MetricBar,
  SectionTitle,
  SelectChip,
  StepFlowCard,
  formatDateLabel,
  formatPercent,
  sharedStyles,
} from "@/features/workplace/WorkplacePart2Ui";
import { fetchRetentionReport, type RetentionReport } from "@/workplace/api";
import { spacing } from "@/theme/colors";

const RANGES = ["30d", "90d", "180d"] as const;

export function WorkplaceRetentionScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();

  const [range, setRange] = useState<(typeof RANGES)[number]>("90d");
  const [report, setReport] = useState<RetentionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      setReport(await fetchRetentionReport(auth, { range }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load retention analytics");
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
        <LoadingState message="Loading retention analytics…" />
      </ResponsiveShell>
    );
  }

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Retention"
        subtitle="Returning-client trends, churn risk, and visit frequency"
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
              icon="repeat-outline"
              label="Returning"
              value={String(report.summary.returning_clients)}
            />
            <IconStatCard
              icon="person-add-outline"
              label="New"
              value={String(report.summary.new_clients)}
            />
            <IconStatCard
              icon="warning-outline"
              label="Churn risk"
              value={String(report.summary.churn_risk_count)}
            />
            <IconStatCard
              icon="bar-chart-outline"
              label="Visit frequency"
              value={report.summary.average_visits_per_client.toFixed(1)}
            />
          </IconStatGrid>

          <StepFlowCard
            title="How to use retention"
            description="This dashboard helps owners decide who needs a follow-up message and which cohorts are slipping."
            steps={[
              "Choose the reporting range for recent retention behaviour.",
              "Review churn-risk clients and identify who needs outreach.",
              "Use cohort retention percentages to spot long-term visit drop-off.",
            ]}
          >
            <Button
              label="Message churn-risk clients"
              onPress={() =>
                Alert.alert(
                  "Messaging placeholder",
                  "Quick outreach actions for at-risk clients will be connected in a later batch."
                )
              }
            />
          </StepFlowCard>

          <View style={styles.grid}>
            <View style={styles.column}>
              <SectionTitle title="Cohort retention" subtitle="Saved as a placeholder-friendly percentage trend" />
              {report.cohorts.length ? (
                report.cohorts.map((cohort) => (
                  <MetricBar
                    key={cohort.label}
                    label={cohort.label}
                    value={cohort.retention_percent}
                    subtitle="Retention percentage for this cohort window"
                    tint="#8B5CF6"
                  />
                ))
              ) : (
                <EmptyState title="No cohort rows yet" description="Cohort placeholders will fill in when the retention endpoint is ready." />
              )}
            </View>

            <View style={styles.column}>
              <SectionTitle title="Churn risk list" subtitle="Clients who may need a quick follow-up" />
              {report.churn_risk.length ? (
                report.churn_risk.map((client) => (
                  <ListRow
                    key={client.id}
                    icon="person-outline"
                    title={client.name}
                    subtitle={`Last visit ${formatDateLabel(client.last_visit_at)}`}
                    right={client.risk_level}
                  />
                ))
              ) : (
                <EmptyState title="No churn-risk clients" description="At-risk clients will show up here when the backend sends churn scores." />
              )}
            </View>
          </View>
        </>
      ) : (
        <EmptyState title="Retention analytics unavailable" description={error || "No retention data was returned."} />
      )}
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.md },
  column: { gap: spacing.sm },
});
