import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { TenantMtnMomoConnectionPanel } from "@/features/payment-settings/TenantMtnMomoConnectionPanel";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { fetchPaymentSettings, updatePaymentSettings } from "@/payment-settings/api";
import {
  GATEWAY_STATUS_LABELS,
  PAYMENT_MODE_LABELS,
  SETTLEMENT_METHOD_LABELS,
  SETTLEMENT_SCHEDULE_LABELS,
  type PaymentGatewayKey,
  type SettlementMethod,
  type SettlementSchedule,
  type TenantPaymentMode,
  type TenantPaymentModeSettings,
} from "@/payment-settings/types";
import { colors, radii, spacing } from "@/theme/colors";

const MODE_OPTIONS: { value: TenantPaymentMode; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  {
    value: "platform_account",
    title: "Use Schedelux Payments",
    subtitle: "Collect through Schedelux and view your wallet balance.",
    icon: "wallet-outline",
  },
  {
    value: "tenant_own_account",
    title: "Connect My Own Gateway",
    subtitle: "Enterprise salons with their own MTN or card gateway.",
    icon: "business-outline",
  },
  {
    value: "disabled",
    title: "Disable Online Payments",
    subtitle: "Turn off MoMo requests and online collection.",
    icon: "close-circle-outline",
  },
];

const SCHEDULE_OPTIONS: SettlementSchedule[] = ["manual", "daily", "weekly", "monthly"];
const METHOD_OPTIONS: (SettlementMethod | "")[] = ["", "momo", "bank", "cash", "other"];

type Props = {
  embedded?: boolean;
  onSaved?: () => void;
};

export function TenantPaymentSettingsScreen({ embedded = false, onSaved }: Props) {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [settings, setSettings] = useState<TenantPaymentModeSettings | null>(null);
  const [mode, setMode] = useState<TenantPaymentMode>("platform_account");
  const [collectionEnabled, setCollectionEnabled] = useState(true);
  const [schedule, setSchedule] = useState<SettlementSchedule>("manual");
  const [settlementMethod, setSettlementMethod] = useState<SettlementMethod | "">("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingSettlement, setEditingSettlement] = useState(false);

  const resultFromSettings = useCallback((s: TenantPaymentModeSettings) => {
    setSettings(s);
    setMode(s.mode);
    setCollectionEnabled(s.is_payment_enabled);
    setSchedule(s.settlement_schedule);
    setSettlementMethod(s.settlement_method ?? "");
    setAccountName(s.settlement_account_name ?? "");
    setAccountNumber(s.settlement_account_number ?? "");
    setProvider(s.settlement_provider ?? "");
    setNotes(s.settlement_notes ?? "");
  }, []);

  const load = useCallback(
    async (force = false) => {
      if (!auth) return;
      setError("");
      try {
        const data = await fetchPaymentSettings(auth);
        resultFromSettings(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load payment settings");
      }
    },
    [auth, resultFromSettings]
  );

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  async function save() {
    if (!auth) return;
    setSaving(true);
    setError("");
    try {
      const data = await updatePaymentSettings(auth, {
        mode,
        is_payment_enabled: mode === "disabled" ? false : collectionEnabled,
        settlement_schedule: schedule,
        settlement_method: settlementMethod || null,
        settlement_account_name: accountName || null,
        settlement_account_number: accountNumber || null,
        settlement_provider: provider || null,
        settlement_notes: notes || null,
      });
      resultFromSettings(data);
      setEditingSettlement(false);
      onSaved?.();
      Alert.alert("Saved", "Payment settings updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setSaving(false);
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
    return <LoadingState message="Loading payment settings…" />;
  }

  const summaryPane = (
    <View style={styles.pane}>
      <Text style={styles.sectionTitle}>Payment mode</Text>
      <Card>
        <Text style={styles.summaryLabel}>Current mode</Text>
        <Text style={styles.summaryValue}>{PAYMENT_MODE_LABELS[mode]}</Text>
        <Text style={styles.summaryMeta}>
          Collection {mode === "disabled" || !collectionEnabled ? "off" : "on"}
        </Text>
      </Card>

      {settings?.gateway_status ? (
        <Card>
          <Text style={styles.summaryLabel}>Gateways</Text>
          {(Object.keys(settings.gateway_status) as PaymentGatewayKey[]).map((key) => {
            const g = settings.gateway_status[key];
            return (
              <View key={key} style={styles.gatewayRow}>
                <Text style={styles.gatewayName}>{g.label}</Text>
                <Text style={styles.gatewayStatus}>{GATEWAY_STATUS_LABELS[g.status]}</Text>
              </View>
            );
          })}
        </Card>
      ) : null}

      <TenantMtnMomoConnectionPanel compact={useSplitLayout} />

      <Card>
        <Text style={styles.summaryLabel}>Settlement</Text>
        <Text style={styles.summaryValue}>{SETTLEMENT_SCHEDULE_LABELS[schedule]}</Text>
        {settlementMethod ? (
          <Text style={styles.summaryMeta}>{SETTLEMENT_METHOD_LABELS[settlementMethod]}</Text>
        ) : (
          <Text style={styles.summaryMeta}>Method not set</Text>
        )}
        {accountName ? <Text style={styles.summaryMeta}>{accountName}</Text> : null}
        {accountNumber ? <Text style={styles.summaryMeta}>{accountNumber}</Text> : null}
      </Card>
    </View>
  );

  const editPane = (
    <View style={styles.pane}>
      {useSplitLayout ? <TenantMtnMomoConnectionPanel /> : null}
      <Text style={styles.sectionTitle}>Configure</Text>

      {MODE_OPTIONS.map((opt) => {
        const selected = mode === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              setMode(opt.value);
              if (opt.value === "disabled") setCollectionEnabled(false);
              else setCollectionEnabled(true);
            }}
            style={[styles.modeCard, selected && styles.modeCardActive]}
          >
            <Ionicons name={opt.icon} size={22} color={selected ? colors.primaryDark : colors.mutedForeground} />
            <View style={styles.modeText}>
              <Text style={styles.modeTitle}>{opt.title}</Text>
              <Text style={styles.modeSub}>{opt.subtitle}</Text>
            </View>
          </Pressable>
        );
      })}

      {mode === "tenant_own_account" ? (
        <Text style={styles.hint}>
          Your own MTN gateway connection will be set up in a later release. General Office may need to approve
          enterprise accounts.
        </Text>
      ) : null}

      {mode !== "disabled" ? (
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Enable payment collection</Text>
          <Switch value={collectionEnabled} onValueChange={setCollectionEnabled} />
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Settlement details</Text>

      {!useSplitLayout && !editingSettlement ? (
        <Button label="Edit settlement details" variant="secondary" onPress={() => setEditingSettlement(true)} />
      ) : null}

      {(useSplitLayout || editingSettlement) ? (
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Payout schedule</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {SCHEDULE_OPTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSchedule(s)}
                style={[styles.chip, schedule === s && styles.chipActive]}
              >
                <Text style={[styles.chipText, schedule === s && styles.chipTextActive]}>
                  {SETTLEMENT_SCHEDULE_LABELS[s]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Settlement method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {METHOD_OPTIONS.map((m) => (
              <Pressable
                key={m || "none"}
                onPress={() => setSettlementMethod(m)}
                style={[styles.chip, settlementMethod === m && styles.chipActive]}
              >
                <Text style={[styles.chipText, settlementMethod === m && styles.chipTextActive]}>
                  {m ? SETTLEMENT_METHOD_LABELS[m] : "Not set"}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Field label="Account name" value={accountName} onChangeText={setAccountName} />
          <Field label="Account / MoMo number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="phone-pad" />
          <Field label="Provider / bank" value={provider} onChangeText={setProvider} />
          <Field label="Notes" value={notes} onChangeText={setNotes} />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label={saving ? "Saving…" : "Save payment settings"} onPress={() => void save()} disabled={saving} />
    </View>
  );

  const body = useSplitLayout ? (
    <View style={styles.split}>
      {summaryPane}
      {editPane}
    </View>
  ) : editingSettlement ? (
    editPane
  ) : (
  <>
      {summaryPane}
      <Button label="Edit payment mode & settlement" onPress={() => setEditingSettlement(true)} />
    </>
  );

  if (embedded) {
    return <View style={styles.embedded}>{body}</View>;
  }

  return (
    <ResponsiveShell scroll={false}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true).finally(() => setRefreshing(false));
            }}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {useSplitLayout ? (
          <ScreenHeader
            title="Payment settings"
            subtitle="Mode, gateways & settlement"
            onRefresh={() => void load(true)}
            onSignOut={() => void logout()}
          />
        ) : (
          <Header
            title="Payment settings"
            subtitle="Mode, gateways & settlement"
            right={
              editingSettlement ? (
                <Button label="Back" variant="ghost" onPress={() => setEditingSettlement(false)} />
              ) : undefined
            }
          />
        )}
        {body}
      </ScrollView>
    </ResponsiveShell>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "phone-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.input}
        placeholderTextColor={colors.mutedForeground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xl, gap: spacing.md },
  embedded: { flex: 1 },
  split: { flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" },
  pane: { flex: 1, minWidth: 0, gap: spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground },
  summaryLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", color: colors.mutedForeground },
  summaryValue: { fontSize: 18, fontWeight: "700", color: colors.black, marginTop: 4 },
  summaryMeta: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  gatewayRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  gatewayName: { fontSize: 14, color: colors.black },
  gatewayStatus: { fontSize: 13, color: colors.mutedForeground },
  modeCard: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeCardActive: { borderColor: colors.primaryDark, backgroundColor: "#FFF0F5" },
  modeText: { flex: 1 },
  modeTitle: { fontSize: 15, fontWeight: "700", color: colors.black },
  modeSub: { fontSize: 13, color: colors.mutedForeground, marginTop: 4, lineHeight: 18 },
  hint: {
    fontSize: 13,
    color: "#92400E",
    backgroundColor: "#FFFBEB",
    borderRadius: radii.md,
    padding: spacing.sm,
    lineHeight: 18,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLabel: { fontSize: 15, fontWeight: "600", color: colors.black },
  form: { gap: spacing.sm },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.black,
    backgroundColor: colors.surface,
  },
  chips: { marginBottom: spacing.xs },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primaryDark, backgroundColor: "#FFF0F5" },
  chipText: { fontSize: 13, color: colors.mutedForeground },
  chipTextActive: { color: colors.primaryDark, fontWeight: "600" },
  error: { color: colors.destructive, fontSize: 14 },
});
