import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
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
  SectionTitle,
  SelectChip,
  StepFlowCard,
  formatDateLabel,
  sharedStyles,
} from "@/features/workplace/WorkplacePart2Ui";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  fetchClients,
  fetchReviewDashboard,
  sendReviewRequest,
  type ClientRow,
  type ComplaintCase,
  type ReviewDashboard,
  type ReviewRecord,
} from "@/workplace/api";
import { colors, radii, spacing } from "@/theme/colors";

export function WorkplaceReviewsScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [dashboard, setDashboard] = useState<ReviewDashboard | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [manualEmail, setManualEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const [dashboardData, clientRes] = await Promise.all([
        fetchReviewDashboard(auth),
        fetchClients(auth, { per_page: 20 }),
      ]);
      setDashboard(dashboardData);
      setClients(clientRes.data ?? []);
      setSelectedReviewId((current) => current ?? dashboardData.reviews[0]?.id ?? null);
      setSelectedClientId((current) => current ?? clientRes.data?.[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load reviews");
      setDashboard(null);
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const selectedReview = useMemo(
    () =>
      dashboard?.reviews.find((review) => review.id === selectedReviewId) ??
      dashboard?.reviews[0] ??
      null,
    [dashboard, selectedReviewId]
  );

  const linkedComplaint = useMemo(
    () =>
      dashboard?.complaints.find(
        (complaint) => complaint.review?.id === selectedReview?.id
      ) ?? null,
    [dashboard, selectedReview]
  );

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  async function handleSendRequest() {
    if (!auth) return;
    const email = manualEmail.trim() || selectedClient?.email || null;
    if (!selectedClientId && !email) {
      setError("Choose a client or provide an email address.");
      return;
    }

    setSending(true);
    setError("");
    try {
      await sendReviewRequest(auth, {
        client_user_id: selectedClientId,
        client_email: email,
      });
      Alert.alert("Review request sent", "The review invite was queued successfully.");
      setManualEmail("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send review request");
    } finally {
      setSending(false);
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
        <LoadingState message="Loading reviews…" />
      </ResponsiveShell>
    );
  }

  if (!dashboard) {
    return (
      <ResponsiveShell>
        <ScreenHeader
          title="Reviews"
          subtitle="Feedback, moderation, and complaint follow-up"
          onRefresh={() => void load()}
          onSignOut={() => void logout()}
        />
        <EmptyState title="Reviews unavailable" description={error || "No review data was returned."} />
      </ResponsiveShell>
    );
  }

  const listPane = (
    <View style={sharedStyles.listPane}>
      <SectionTitle title="Recent reviews" subtitle="Low ratings can be escalated into complaint cases." />
      {dashboard.reviews.length === 0 ? (
        <EmptyState title="No reviews yet" description="Completed review forms will appear here." />
      ) : (
        dashboard.reviews.map((review) => {
          const selected = review.id === selectedReview?.id;
          return (
            <Pressable
              key={review.id}
              onPress={() => setSelectedReviewId(review.id)}
              style={[styles.reviewCard, selected && styles.reviewCardSelected]}
            >
              <Text style={styles.reviewTitle}>
                {review.client_name || "Client review"} · {review.rating}/5
              </Text>
              <Text style={styles.reviewMeta}>
                {review.service_name || "Service"} · {review.staff_member_name || "Any staff"}
              </Text>
              <Text style={styles.reviewBody} numberOfLines={3}>
                {review.comment || "No written comment provided."}
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const detailPane = (
    <View style={sharedStyles.detailPane}>
      <Card style={styles.detailCard}>
        <Text style={styles.detailTitle}>{selectedReview?.client_name || "Select a review"}</Text>
        <Text style={sharedStyles.muted}>
          {selectedReview
            ? `${selectedReview.rating}/5 · ${selectedReview.status} · ${selectedReview.source}`
            : "Choose a review to see moderation detail and complaint context."}
        </Text>
        {selectedReview ? (
          <>
            <Text style={styles.commentBox}>{selectedReview.comment || "No comment provided."}</Text>
            <View style={styles.badgeRow}>
              <Card>
                <Text style={styles.metricLabel}>Verified</Text>
                <Text style={styles.metricValue}>{selectedReview.is_verified ? "Yes" : "No"}</Text>
              </Card>
              <Card>
                <Text style={styles.metricLabel}>Service</Text>
                <Text style={styles.metricValue}>{selectedReview.service_name || "General"}</Text>
              </Card>
              <Card>
                <Text style={styles.metricLabel}>Created</Text>
                <Text style={styles.metricValue}>{formatDateLabel(selectedReview.created_at)}</Text>
              </Card>
            </View>
          </>
        ) : null}
      </Card>

      <StepFlowCard
        title="Send review request"
        description="Quick mobile workflow for manual follow-up after a visit."
        steps={[
          "Choose a recent client or type their email address.",
          "Confirm the review settings and Google automation below.",
          "Tap Send review request to queue the message.",
        ]}
      >
        <View style={sharedStyles.rowWrap}>
          {clients.slice(0, 8).map((client) => (
            <SelectChip
              key={client.id}
              label={client.name}
              selected={client.id === selectedClientId}
              onPress={() => setSelectedClientId(client.id)}
            />
          ))}
        </View>
        <Input
          label="Manual email"
          value={manualEmail}
          keyboardType="email-address"
          onChangeText={setManualEmail}
          placeholder={selectedClient?.email ?? "customer@example.com"}
        />
        {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
        <Button
          label={sending ? "Sending…" : "Send review request"}
          onPress={() => void handleSendRequest()}
          loading={sending}
        />
      </StepFlowCard>

      <Card style={styles.detailCard}>
        <SectionTitle title="Review settings" subtitle="Current automation and escalation thresholds" />
        <ListRow
          icon="send-outline"
          title="Auto-send after appointment"
          subtitle="Review invites are sent automatically after completed appointments."
          right={dashboard.settings?.auto_send_after_appointment ? "On" : "Off"}
        />
        <ListRow
          icon="time-outline"
          title="Delay before sending"
          subtitle="Wait time after appointment completion"
          right={`${dashboard.settings?.delay_hours ?? 0}h`}
        />
        <ListRow
          icon="logo-google"
          title="Google review automation"
          subtitle={dashboard.settings?.google_review_url || "No Google review URL configured"}
          right={dashboard.settings?.auto_send_google_review ? "On" : "Off"}
        />
        <ListRow
          icon="warning-outline"
          title="Low-rating threshold"
          subtitle="Ratings at or below this value can create complaint cases"
          right={String(dashboard.settings?.low_rating_threshold ?? 0)}
        />
      </Card>

      <Card style={styles.detailCard}>
        <SectionTitle title="Complaint case" subtitle="Negative-review workflow for the selected review" />
        {linkedComplaint ? (
          <>
            <ListRow
              icon="alert-circle-outline"
              title={`Case ${linkedComplaint.uuid}`}
              subtitle={linkedComplaint.internal_notes || "No internal notes yet"}
              right={linkedComplaint.status}
            />
            <Text style={sharedStyles.muted}>
              Resolution: {linkedComplaint.resolution_note || "Pending resolution"} · Closed{" "}
              {formatDateLabel(linkedComplaint.resolved_at)}
            </Text>
          </>
        ) : (
          <EmptyState
            title="No complaint case"
            description="Only low ratings or escalated reviews will show a complaint workflow here."
          />
        )}
      </Card>
    </View>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Reviews"
        subtitle="Feedback, automation, and complaint follow-up"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      <IconStatGrid>
        <IconStatCard
          icon="star-outline"
          label="Average rating"
          value={dashboard.stats.average_rating.toFixed(1)}
        />
        <IconStatCard
          icon="chatbubble-ellipses-outline"
          label="Total reviews"
          value={String(dashboard.stats.total_reviews)}
        />
        <IconStatCard
          icon="paper-plane-outline"
          label="Pending requests"
          value={String(dashboard.stats.pending_requests)}
        />
        <IconStatCard
          icon="warning-outline"
          label="Complaint cases"
          value={String(dashboard.stats.low_rating_cases)}
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
  reviewCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: 6,
  },
  reviewCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  reviewTitle: { fontSize: 16, fontWeight: "700", color: colors.primaryForeground },
  reviewMeta: { fontSize: 13, color: colors.mutedForeground },
  reviewBody: { fontSize: 14, color: colors.primaryForeground, lineHeight: 20 },
  detailCard: { gap: spacing.md },
  detailTitle: { fontSize: 22, fontWeight: "800", color: colors.primaryForeground },
  commentBox: {
    fontSize: 15,
    color: colors.primaryForeground,
    lineHeight: 22,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.muted,
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.mutedForeground,
  },
  metricValue: { fontSize: 15, fontWeight: "700", color: colors.primaryForeground, marginTop: 4 },
});
