import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { formatMoney } from "@/booking/format";
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
  fetchClientMemberships,
  fetchClients,
  fetchMembershipPlans,
  sellMembership,
  type ClientMembership,
  type ClientRow,
  type MembershipPlan,
} from "@/workplace/api";
import { colors, radii, spacing } from "@/theme/colors";

export function WorkplaceMembershipsScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberships, setMemberships] = useState<ClientMembership[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const [planRes, membershipRes, clientRes] = await Promise.all([
        fetchMembershipPlans(auth, { per_page: 50 }),
        fetchClientMemberships(auth, { per_page: 50 }),
        fetchClients(auth, { per_page: 20 }),
      ]);
      const nextPlans = planRes.data ?? [];
      const nextMemberships = membershipRes.data ?? [];
      setPlans(nextPlans);
      setMemberships(nextMemberships);
      setClients(clientRes.data ?? []);
      setSelectedPlanId((current) => current ?? nextPlans[0]?.id ?? null);
      setSelectedClientId((current) => current ?? clientRes.data?.[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load memberships");
      setPlans([]);
      setMemberships([]);
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null,
    [plans, selectedPlanId]
  );

  const matchingMemberships = useMemo(
    () =>
      memberships.filter(
        (membership) =>
          (membership.plan?.id ?? membership.membership_plan_id) === selectedPlan?.id
      ),
    [memberships, selectedPlan]
  );

  async function handleSellMembership() {
    if (!auth || !selectedPlan || !selectedClientId) {
      setError("Choose a client and membership plan first.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await sellMembership(auth, {
        client_user_id: selectedClientId,
        membership_plan_id: selectedPlan.id,
        starts_at: startsAt.trim() || null,
      });
      Alert.alert("Membership sold", "The client membership was created successfully.");
      setStartsAt("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sell membership");
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
        <LoadingState message="Loading memberships…" />
      </ResponsiveShell>
    );
  }

  const summaryCards = (
    <IconStatGrid>
      <IconStatCard
        icon="card-outline"
        label="Active plans"
        value={String(plans.filter((plan) => plan.is_active).length)}
      />
      <IconStatCard
        icon="people-outline"
        label="Client memberships"
        value={String(memberships.length)}
      />
      <IconStatCard
        icon="flash-outline"
        label="Priority perks"
        value={String(plans.filter((plan) => plan.priority_booking).length)}
      />
      <IconStatCard
        icon="pricetag-outline"
        label="Top plan"
        value={selectedPlan ? formatMoney(selectedPlan.price_cents) : "GHS 0.00"}
      />
    </IconStatGrid>
  );

  const listPane = (
    <View style={sharedStyles.listPane}>
      <SectionTitle
        title="Plans"
        subtitle="Phone view keeps sales simple. Tablet view shows plan detail beside the list."
      />
      {plans.length === 0 ? (
        <EmptyState
          title="No membership plans yet"
          description="Create membership plans in the Schedelux web app, then sell them here."
        />
      ) : (
        plans.map((plan) => {
          const selected = plan.id === selectedPlan?.id;
          return (
            <Pressable
              key={plan.id}
              onPress={() => setSelectedPlanId(plan.id)}
              style={[styles.planCard, selected && styles.planCardSelected]}
            >
              <Text style={styles.planTitle}>{plan.name}</Text>
              <Text style={styles.planMeta}>
                {formatMoney(plan.price_cents)} · {plan.billing_interval}
              </Text>
              <Text style={styles.planMeta}>
                {plan.discount_percent}% off · {plan.priority_booking ? "Priority booking" : "Standard"}
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const detailPane = selectedPlan ? (
    <View style={sharedStyles.detailPane}>
      <Card style={styles.detailCard}>
        <Text style={styles.detailTitle}>{selectedPlan.name}</Text>
        <Text style={sharedStyles.muted}>
          {selectedPlan.description || "Membership perks are managed from the Schedelux web app."}
        </Text>
        <View style={styles.detailGrid}>
          <Card>
            <Text style={styles.metricLabel}>Billing</Text>
            <Text style={styles.metricValue}>{selectedPlan.billing_interval}</Text>
          </Card>
          <Card>
            <Text style={styles.metricLabel}>Discount</Text>
            <Text style={styles.metricValue}>{selectedPlan.discount_percent}%</Text>
          </Card>
          <Card>
            <Text style={styles.metricLabel}>Points</Text>
            <Text style={styles.metricValue}>{selectedPlan.points_multiplier}x</Text>
          </Card>
          <Card>
            <Text style={styles.metricLabel}>Free services</Text>
            <Text style={styles.metricValue}>{selectedPlan.free_service_ids?.length ?? 0}</Text>
          </Card>
        </View>
      </Card>

      <StepFlowCard
        title="Sell membership"
        description="A step-by-step flow for staff on mobile, with the selected plan already locked in."
        steps={[
          "Choose the customer who wants the membership.",
          "Confirm the start date if it begins later than today.",
          "Review plan price and perks, then tap Sell membership.",
        ]}
      >
        <SectionTitle title="Customer" />
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
          label="Start date"
          placeholder="YYYY-MM-DD"
          value={startsAt}
          onChangeText={setStartsAt}
        />
        {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
        <Button
          label={submitting ? "Selling membership…" : "Sell membership"}
          onPress={() => void handleSellMembership()}
          loading={submitting}
        />
      </StepFlowCard>

      <Card style={styles.detailCard}>
        <SectionTitle title="Recent client memberships" subtitle={`${matchingMemberships.length} linked to this plan`} />
        <View style={styles.listGroup}>
          {matchingMemberships.length === 0 ? (
            <EmptyState
              title="No clients on this plan yet"
              description="Sell this membership from the flow above to see balances here."
            />
          ) : (
            matchingMemberships.slice(0, 6).map((membership) => (
              <ListRow
                key={membership.id}
                icon="person-circle-outline"
                title={membership.client?.name ?? `Client #${membership.id}`}
                subtitle={`Starts ${formatDateLabel(membership.starts_at)} · Next bill ${formatDateLabel(
                  membership.next_billing_at
                )}`}
                right={membership.status}
              />
            ))
          )}
        </View>
      </Card>
    </View>
  ) : (
    <View style={sharedStyles.detailPane}>
      <EmptyState
        title="Choose a membership plan"
        description="Plan details and the sell flow appear here once you select a plan."
      />
    </View>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Memberships"
        subtitle="Plans, perks, and quick mobile selling"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      {summaryCards}
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
  planCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: 4,
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  planTitle: { fontSize: 17, fontWeight: "700", color: colors.primaryForeground },
  planMeta: { fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
  detailCard: { gap: spacing.md },
  detailTitle: { fontSize: 22, fontWeight: "800", color: colors.primaryForeground },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.mutedForeground,
  },
  metricValue: { fontSize: 16, fontWeight: "700", color: colors.primaryForeground, marginTop: 4 },
  listGroup: { gap: spacing.xs },
});
