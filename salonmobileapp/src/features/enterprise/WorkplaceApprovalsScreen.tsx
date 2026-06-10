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
import { DetailCard, StatusPill, part3Styles } from "@/features/part3/Part3Shared";
import { SectionTitle, sharedStyles } from "@/features/workplace/WorkplacePart2Ui";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  fetchEnterpriseApprovals,
  type EnterpriseApproval,
  type EnterpriseApprovalsInbox,
} from "@/workplace/api";

const FALLBACK_INBOX: EnterpriseApprovalsInbox = {
  summary: {
    pending: 5,
    urgent: 2,
    approved_today: 3,
    rejected_today: 1,
  },
  queue: [
    {
      id: 1,
      type: "refund",
      title: "Refund for prepaid glow facial",
      requested_by: "Abena",
      amount_cents: 28000,
      submitted_at: new Date().toISOString(),
      priority: "urgent",
      status: "pending",
      branch_name: "Downtown",
    },
    {
      id: 2,
      type: "discount",
      title: "Manager override on bridal package",
      requested_by: "Mabel",
      amount_cents: 15000,
      submitted_at: new Date().toISOString(),
      priority: "normal",
      status: "pending",
      branch_name: "Airport",
    },
  ],
};

export function WorkplaceApprovalsScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [inbox, setInbox] = useState<EnterpriseApprovalsInbox | null>(null);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const next = await fetchEnterpriseApprovals(auth);
      setInbox(next);
      setSelectedId((current) => current ?? next.queue[0]?.id ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.message}. Showing preview inbox.` : "Could not load approvals inbox."
      );
      setInbox(FALLBACK_INBOX);
      setSelectedId((current) => current ?? FALLBACK_INBOX.queue[0]?.id ?? null);
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const queue = inbox?.queue ?? [];
  const selected = useMemo<EnterpriseApproval | null>(
    () => queue.find((item) => item.id === selectedId) ?? queue[0] ?? null,
    [queue, selectedId]
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
        <LoadingState message="Loading approvals…" />
      </ResponsiveShell>
    );
  }

  const listPane = (
    <View style={sharedStyles.listPane}>
      <SectionTitle title="Approval queue" subtitle="Urgent items bubble to the top for managers on mobile." />
      {queue.map((item) => {
        const isSelected = item.id === selected?.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => setSelectedId(item.id)}
            style={[part3Styles.listCard, isSelected && part3Styles.listCardSelected]}
          >
            <Text style={part3Styles.cardTitle}>{item.title}</Text>
            <Text style={part3Styles.cardMeta}>{item.branch_name || "Branch pending"} · {item.requested_by}</Text>
            <View style={styles.pillRow}>
              <StatusPill label={item.type} tone="info" />
              <StatusPill label={item.priority} tone={item.priority === "urgent" ? "warning" : "neutral"} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const detailPane = (
    <View style={sharedStyles.detailPane}>
      <DetailCard
        title={selected?.title ?? "Select an approval"}
        subtitle={selected ? `${selected.type} request from ${selected.requested_by}` : "Choose an item from the approval queue."}
      >
        {selected ? (
          <View style={part3Styles.stack}>
            <ListRow
              icon="cash-outline"
              title="Requested amount"
              subtitle="Amount attached to the approval request"
              right={selected.amount_cents ? formatMoney(selected.amount_cents) : "Review"}
            />
            <ListRow
              icon="pin-outline"
              title="Branch"
              subtitle="Request origin"
              right={selected.branch_name || "Global"}
            />
            <View style={styles.actionRow}>
              <Button
                label="Approve"
                onPress={() => Alert.alert("Approval placeholder", "Approve/reject actions will connect to the enterprise workflow API in a follow-up pass.")}
              />
              <Button
                label="Reject"
                variant="destructive"
                onPress={() => Alert.alert("Approval placeholder", "Rejection notes will be captured once the approval write API is ready for mobile.")}
              />
            </View>
          </View>
        ) : (
          <EmptyState title="No approval selected" description="Tap a queue item to inspect the approval detail." />
        )}
      </DetailCard>

      <DetailCard title="Queue notes" subtitle="The mobile inbox focuses on urgent actions while the full policy setup remains in the web admin area.">
        <View style={part3Styles.stack}>
          <ListRow icon="return-down-forward-outline" title="Refunds" subtitle="High-risk cash reversals or wallet adjustments" right="Tracked" />
          <ListRow icon="pricetag-outline" title="Discounts" subtitle="Large discounts and manager overrides" right="Tracked" />
          <ListRow icon="card-outline" title="Payroll / PO" subtitle="Finance and purchasing approvals" right="Tracked" />
        </View>
      </DetailCard>
    </View>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Approvals"
        subtitle="Enterprise approval inbox for urgent mobile actions"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
      <IconStatGrid>
        <IconStatCard icon="mail-unread-outline" label="Pending" value={String(inbox?.summary.pending ?? 0)} />
        <IconStatCard icon="warning-outline" label="Urgent" value={String(inbox?.summary.urgent ?? 0)} />
        <IconStatCard icon="checkmark-circle-outline" label="Approved" value={String(inbox?.summary.approved_today ?? 0)} />
        <IconStatCard icon="close-circle-outline" label="Rejected" value={String(inbox?.summary.rejected_today ?? 0)} />
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
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
