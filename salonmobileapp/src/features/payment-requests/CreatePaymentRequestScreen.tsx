import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { Header } from "@/components/Header";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { createPaymentRequest, verifyPaymentRequest } from "@/payment-requests/api";
import type { PaymentRequestPrefill } from "@/payment-requests/prefill";
import { PAYMENT_REQUEST_REASON_LABELS, type PaymentRequest } from "@/payment-requests/types";
import { fetchClients, type ClientRow } from "@/workplace/api";
import { formatMoney } from "@/booking/format";
import { colors, radii, spacing } from "@/theme/colors";

type Step = "form" | "confirm" | "waiting";

const REASONS = [
  "booking_payment",
  "deposit_payment",
  "invoice_payment",
  "pos_sale",
  "sms_package_invoice",
  "other",
] as const;

type CreatePaymentRequestScreenProps = {
  prefill?: PaymentRequestPrefill;
  onDone?: () => void;
  embedded?: boolean;
};

export function CreatePaymentRequestScreen({
  prefill,
  onDone,
  embedded = false,
}: CreatePaymentRequestScreenProps) {
  const router = useRouter();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [step, setStep] = useState<Step>("form");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(prefill?.customer_id ?? null);
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [amountInput, setAmountInput] = useState(
    prefill?.amount_cents != null ? String((prefill.amount_cents / 100).toFixed(2)) : ""
  );
  const [currency, setCurrency] = useState(prefill?.currency ?? "GHS");
  const [gateway, setGateway] = useState<"paystack" | "flutterwave" | "mtn_momo">(
    prefill?.gateway ?? "mtn_momo"
  );
  const [reason, setReason] = useState(prefill?.reason ?? "other");
  const [description, setDescription] = useState(prefill?.description ?? "");
  const [bookingId] = useState(prefill?.booking_id ?? null);
  const [posSaleId] = useState(prefill?.pos_sale_id ?? null);
  const [invoiceId] = useState(prefill?.invoice_id ?? null);
  const [branchId] = useState(prefill?.branch_id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<PaymentRequest | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const amountCents = Math.max(0, Math.round((parseFloat(amountInput) || 0) * 100));

  const loadClients = useCallback(async () => {
    if (!auth) return;
    try {
      const res = await fetchClients(auth, { per_page: 100 });
      setClients(res.data ?? []);
    } catch {
      setClients([]);
    }
  }, [auth]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const customerName = useMemo(() => {
    if (customerId) return clients.find((c) => c.id === customerId)?.name ?? prefill?.customer_name;
    return prefill?.customer_name ?? "Customer";
  }, [customerId, clients, prefill?.customer_name]);

  function selectClient(c: ClientRow) {
    setCustomerId(c.id);
    setPhone(c.phone ?? phone);
    setEmail(c.email ?? email);
  }

  async function submit() {
    if (!auth) return;
    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }
    if (amountCents < 100) {
      setError("Amount must be at least 1.00");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const record = await createPaymentRequest(auth, {
        customer_id: customerId,
        booking_id: bookingId,
        pos_sale_id: posSaleId,
        invoice_id: invoiceId,
        branch_id: branchId,
        amount_cents: amountCents,
        currency,
        phone: phone.trim(),
        email: email.trim() || null,
        gateway,
        reason,
        description: description.trim() || null,
      });
      setCreated(record);
      setStep("waiting");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create payment request");
    } finally {
      setSubmitting(false);
    }
  }

  const refreshStatus = useCallback(async () => {
    if (!auth || !created || created.gateway !== "mtn_momo") return;
    setRefreshing(true);
    try {
      const updated = await verifyPaymentRequest(auth, created.id);
      setCreated(updated);
    } catch {
      // polling errors are silent
    } finally {
      setRefreshing(false);
    }
  }, [auth, created]);

  useEffect(() => {
    if (step !== "waiting" || !created || created.gateway !== "mtn_momo") return;
    if (["success", "failed", "cancelled"].includes(created.status)) return;
    const timer = setInterval(() => {
      void refreshStatus();
    }, 5000);
    return () => clearInterval(timer);
  }, [step, created, refreshStatus]);

  async function shareReference() {
    if (!created?.reference) return;
    await Share.share({
      message: `MoMo payment request ${created.reference}. Please approve the prompt on your phone. Do not share your PIN with anyone.`,
    });
  }

  function finish() {
    if (onDone) onDone();
    else router.back();
  }

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  const formBody = (
    <ScrollView contentContainerStyle={styles.scroll}>
      {step === "form" ? (
        <>
          <Card>
            <View style={styles.pinNotice}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.pinText}>
                Customer enters MoMo PIN only on their phone. Never ask for their PIN.
              </Text>
            </View>
          </Card>

          {clients.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.label}>Customer (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {clients.slice(0, 12).map((c) => (
                  <Pressable
                    key={c.id}
                    style={[styles.clientChip, customerId === c.id && styles.clientChipActive]}
                    onPress={() => selectClient(c)}
                  >
                    <Text style={[styles.clientChipText, customerId === c.id && styles.clientChipTextActive]}>
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Field label="Phone *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Field label={`Amount (${currency}) *`} value={amountInput} onChangeText={setAmountInput} keyboardType="decimal-pad" />

          <View style={styles.section}>
            <Text style={styles.label}>Gateway</Text>
            <View style={styles.row}>
              {(["mtn_momo", "paystack", "flutterwave"] as const).map((g) => (
                <Pressable
                  key={g}
                  style={[styles.chip, gateway === g && styles.chipActive]}
                  onPress={() => setGateway(g)}
                >
                  <Text style={[styles.chipText, gateway === g && styles.chipTextActive]}>
                    {g === "mtn_momo" ? "MTN Direct" : g}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Reason</Text>
            <View style={styles.reasonWrap}>
              {REASONS.map((r) => (
                <Pressable
                  key={r}
                  style={[styles.chip, reason === r && styles.chipActive]}
                  onPress={() => setReason(r)}
                >
                  <Text style={[styles.chipText, reason === r && styles.chipTextActive]}>
                    {PAYMENT_REQUEST_REASON_LABELS[r] ?? r}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Field label="Note" value={description} onChangeText={setDescription} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label="Review & send" onPress={() => (phone.trim() && amountCents >= 100 ? setStep("confirm") : setError("Enter phone and amount"))} />
        </>
      ) : null}

      {step === "confirm" ? (
        <>
          <Card>
            <Text style={styles.confirmLine}>Customer: {customerName ?? "—"}</Text>
            <Text style={styles.confirmLine}>Phone: {phone}</Text>
            <Text style={styles.confirmLine}>Amount: {formatMoney(amountCents, currency)}</Text>
            <Text style={styles.confirmLine}>Gateway: {gateway}</Text>
            <Text style={styles.confirmLine}>
              Reason: {PAYMENT_REQUEST_REASON_LABELS[reason] ?? reason}
            </Text>
          </Card>
          <Text style={styles.confirmWarn}>
            Confirm you are not collecting the customer&apos;s MoMo PIN.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label={submitting ? "Sending…" : "Send payment request"} loading={submitting} onPress={() => void submit()} />
          <Button label="Back" variant="secondary" onPress={() => setStep("form")} />
        </>
      ) : null}

      {step === "waiting" && created ? (
        <>
          <Card>
            <View style={styles.waitHero}>
              <Ionicons
                name={
                  created.status === "success"
                    ? "checkmark-circle-outline"
                    : created.status === "failed" || created.status === "cancelled"
                      ? "close-circle-outline"
                      : "time-outline"
                }
                size={40}
                color={
                  created.status === "success"
                    ? "#059669"
                    : created.status === "failed" || created.status === "cancelled"
                      ? colors.destructive
                      : colors.primaryDark
                }
              />
              <Text style={styles.waitTitle}>
                {created.status === "success"
                  ? "Payment received"
                  : created.status === "failed"
                    ? "Payment failed"
                    : "Waiting for approval"}
              </Text>
              <Text style={styles.waitSub}>
                {created.status === "success"
                  ? "MTN confirmed this payment."
                  : created.status === "failed"
                    ? created.failed_reason ?? "The customer did not complete payment."
                    : `Ask ${customerName} to approve the MoMo prompt on their phone.`}
              </Text>
              <Text style={styles.ref}>{created.reference}</Text>
              <Text style={styles.waitAmount}>{formatMoney(created.amount_cents, created.currency)}</Text>
              {created.provider_status ? (
                <Text style={styles.waitSub}>MTN: {created.provider_status}</Text>
              ) : null}
            </View>
          </Card>
          {created.gateway === "mtn_momo" &&
          !["success", "failed", "cancelled"].includes(created.status) ? (
            <Button
              label={refreshing ? "Refreshing…" : "Refresh status"}
              variant="secondary"
              onPress={() => void refreshStatus()}
            />
          ) : null}
          <Button label="Share reference" variant="secondary" onPress={() => void shareReference()} />
          <Button label="Done" onPress={finish} />
        </>
      ) : null}
    </ScrollView>
  );

  if (embedded) {
    return <View style={styles.embedded}>{formBody}</View>;
  }

  return (
    <ResponsiveShell scroll={false}>
      {!useSplitLayout ? (
        <Header
          title="Request MoMo"
          subtitle="Admin-initiated payment"
          right={<Button label="Back" variant="ghost" onPress={() => router.back()} />}
        />
      ) : null}
      {formBody}
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
  keyboardType?: "phone-pad" | "email-address" | "decimal-pad";
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
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
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  embedded: { flex: 1 },
  section: { gap: spacing.sm },
  label: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground, textTransform: "uppercase" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.black,
  },
  pinNotice: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  pinText: { flex: 1, fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
  row: { flexDirection: "row", gap: spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground, textTransform: "capitalize" },
  chipTextActive: { color: colors.primaryForeground },
  reasonWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  clientChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  clientChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  clientChipText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  clientChipTextActive: { color: colors.primaryForeground },
  error: { color: colors.destructive, fontSize: 14 },
  confirmLine: { fontSize: 15, color: colors.primaryForeground, marginBottom: 6 },
  confirmWarn: { fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
  waitHero: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  waitTitle: { fontSize: 18, fontWeight: "700", color: colors.primaryForeground },
  waitSub: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
  ref: { fontFamily: "monospace", fontSize: 12, color: colors.mutedForeground, marginTop: spacing.sm },
  waitAmount: { fontSize: 22, fontWeight: "700", color: colors.primaryDark },
});
