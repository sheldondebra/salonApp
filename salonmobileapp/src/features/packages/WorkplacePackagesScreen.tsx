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
  fetchClientPackageBalances,
  fetchClients,
  fetchServicePackages,
  redeemClientPackage,
  sellServicePackage,
  type ClientPackageBalance,
  type ClientRow,
  type ServicePackage,
} from "@/workplace/api";
import { colors, radii, spacing } from "@/theme/colors";

export function WorkplacePackagesScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [balances, setBalances] = useState<ClientPackageBalance[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [selectedBalanceId, setSelectedBalanceId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [sessionsInput, setSessionsInput] = useState("1");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const [packageRes, balanceRes, clientRes] = await Promise.all([
        fetchServicePackages(auth, { per_page: 50 }),
        fetchClientPackageBalances(auth, { per_page: 50 }),
        fetchClients(auth, { per_page: 20 }),
      ]);
      const nextPackages = packageRes.data ?? [];
      const nextBalances = balanceRes.data ?? [];
      setPackages(nextPackages);
      setBalances(nextBalances);
      setClients(clientRes.data ?? []);
      setSelectedPackageId((current) => current ?? nextPackages[0]?.id ?? null);
      setSelectedClientId((current) => current ?? clientRes.data?.[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load packages");
      setPackages([]);
      setBalances([]);
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === selectedPackageId) ?? packages[0] ?? null,
    [packages, selectedPackageId]
  );

  const packageBalances = useMemo(
    () =>
      balances.filter(
        (balance) => (balance.package?.id ?? balance.service_package_id) === selectedPackage?.id
      ),
    [balances, selectedPackage]
  );

  useEffect(() => {
    setSelectedBalanceId((current) => {
      if (packageBalances.length === 0) return null;
      if (current && packageBalances.some((balance) => balance.id === current)) return current;
      return packageBalances[0]?.id ?? null;
    });
  }, [packageBalances]);

  const selectedBalance = useMemo(
    () => packageBalances.find((balance) => balance.id === selectedBalanceId) ?? null,
    [packageBalances, selectedBalanceId]
  );

  async function handleSellPackage() {
    if (!auth || !selectedPackage || !selectedClientId) {
      setError("Choose a customer and package first.");
      return;
    }
    setSelling(true);
    setError("");
    try {
      await sellServicePackage(auth, {
        client_user_id: selectedClientId,
        service_package_id: selectedPackage.id,
      });
      Alert.alert("Package sold", "The package balance was assigned to the customer.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sell package");
    } finally {
      setSelling(false);
    }
  }

  async function handleRedeemPackage() {
    if (!auth || !selectedBalance) {
      setError("Choose an active client package balance to redeem.");
      return;
    }
    const sessionsUsed = Math.max(1, Number.parseInt(sessionsInput || "1", 10));
    setRedeeming(true);
    setError("");
    try {
      await redeemClientPackage(auth, selectedBalance.id, {
        sessions_used: sessionsUsed,
        note: note.trim() || null,
      });
      Alert.alert("Package redeemed", "Sessions were deducted from the client package.");
      setNote("");
      setSessionsInput("1");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not redeem package");
    } finally {
      setRedeeming(false);
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
        <LoadingState message="Loading packages…" />
      </ResponsiveShell>
    );
  }

  const listPane = (
    <View style={sharedStyles.listPane}>
      <SectionTitle title="Package catalog" subtitle="Tap a package to see balances and redemption tools." />
      {packages.length === 0 ? (
        <EmptyState
          title="No service packages yet"
          description="Package setup happens in the Schedelux web app, then redemption stays quick on mobile."
        />
      ) : (
        packages.map((item) => {
          const selected = item.id === selectedPackage?.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setSelectedPackageId(item.id)}
              style={[styles.packageCard, selected && styles.packageCardSelected]}
            >
              <Text style={styles.packageTitle}>{item.name}</Text>
              <Text style={styles.packageMeta}>
                {item.sessions_included} sessions · {formatMoney(item.price_cents)}
              </Text>
              <Text style={styles.packageMeta}>
                {item.expiry_days ? `${item.expiry_days} day expiry` : "No expiry set"}
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const detailPane = selectedPackage ? (
    <View style={sharedStyles.detailPane}>
      <Card style={styles.detailCard}>
        <Text style={styles.detailTitle}>{selectedPackage.name}</Text>
        <Text style={sharedStyles.muted}>
          {selectedPackage.description || "Package setup, pricing, and linked service details are managed on web."}
        </Text>
        <View style={styles.detailStats}>
          <Card>
            <Text style={styles.metricLabel}>Sessions</Text>
            <Text style={styles.metricValue}>{selectedPackage.sessions_included}</Text>
          </Card>
          <Card>
            <Text style={styles.metricLabel}>Price</Text>
            <Text style={styles.metricValue}>{formatMoney(selectedPackage.price_cents)}</Text>
          </Card>
          <Card>
            <Text style={styles.metricLabel}>Active balances</Text>
            <Text style={styles.metricValue}>{packageBalances.length}</Text>
          </Card>
        </View>
      </Card>

      <StepFlowCard
        title="Redeem package"
        description="Mobile flow for front-desk teams to validate remaining sessions fast."
        steps={[
          "Pick an active client balance from this package.",
          "Enter how many sessions to use and add an optional note.",
          "Tap Redeem package after confirming remaining sessions.",
        ]}
      >
        <SectionTitle title="Active balances" subtitle="Balances for the selected package" />
        <View style={sharedStyles.rowWrap}>
          {packageBalances.slice(0, 8).map((balance) => (
            <SelectChip
              key={balance.id}
              label={`${balance.client?.name ?? `Client #${balance.id}`} (${balance.sessions_remaining})`}
              selected={balance.id === selectedBalanceId}
              onPress={() => setSelectedBalanceId(balance.id)}
            />
          ))}
        </View>
        {packageBalances.length === 0 ? (
          <EmptyState
            title="No balances to redeem"
            description="Sell this package first, then staff can redeem sessions from this screen."
          />
        ) : null}
        <Input
          label="Sessions to redeem"
          value={sessionsInput}
          keyboardType="number-pad"
          onChangeText={setSessionsInput}
        />
        <Input label="Redemption note" value={note} onChangeText={setNote} />
        {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
        <Button
          label={redeeming ? "Redeeming…" : "Redeem package"}
          onPress={() => void handleRedeemPackage()}
          loading={redeeming}
          disabled={!selectedBalance}
        />
      </StepFlowCard>

      <StepFlowCard
        title="Sell package"
        description="Use this if the customer is buying the selected package now."
        steps={[
          "Choose the customer buying the package.",
          "Confirm the selected package and price.",
          "Tap Sell package to create the client balance.",
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
        <Button
          label={selling ? "Selling…" : "Sell package"}
          variant="secondary"
          onPress={() => void handleSellPackage()}
          loading={selling}
        />
      </StepFlowCard>

      <Card style={styles.detailCard}>
        <SectionTitle title="Recent balances" subtitle={`${packageBalances.length} balances on this package`} />
        {packageBalances.length === 0 ? (
          <EmptyState title="No balances yet" description="Package balances appear here after a sale." />
        ) : (
          packageBalances.slice(0, 6).map((balance) => (
            <ListRow
              key={balance.id}
              icon="albums-outline"
              title={balance.client?.name ?? `Client #${balance.id}`}
              subtitle={`Remaining ${balance.sessions_remaining}/${balance.sessions_total} · Expires ${formatDateLabel(
                balance.expires_at
              )}`}
              right={balance.status}
            />
          ))
        )}
      </Card>
    </View>
  ) : (
    <View style={sharedStyles.detailPane}>
      <EmptyState
        title="Choose a package"
        description="Package balances and redemption tools appear once you select a package."
      />
    </View>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Packages"
        subtitle="Sell package credits and redeem sessions from mobile"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      <IconStatGrid>
        <IconStatCard icon="albums-outline" label="Packages" value={String(packages.length)} />
        <IconStatCard
          icon="checkmark-done-outline"
          label="Active balances"
          value={String(balances.filter((balance) => balance.status === "active").length)}
        />
        <IconStatCard
          icon="time-outline"
          label="Expiring soon"
          value={String(
            balances.filter((balance) => !!balance.expires_at).slice(0, 5).length
          )}
        />
        <IconStatCard
          icon="cash-outline"
          label="Selected value"
          value={selectedPackage ? formatMoney(selectedPackage.price_cents) : "GHS 0.00"}
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
  packageCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: 4,
  },
  packageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  packageTitle: { fontSize: 17, fontWeight: "700", color: colors.primaryForeground },
  packageMeta: { fontSize: 13, color: colors.mutedForeground },
  detailCard: { gap: spacing.md },
  detailTitle: { fontSize: 22, fontWeight: "800", color: colors.primaryForeground },
  detailStats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.mutedForeground,
  },
  metricValue: { fontSize: 16, fontWeight: "700", color: colors.primaryForeground, marginTop: 4 },
});
