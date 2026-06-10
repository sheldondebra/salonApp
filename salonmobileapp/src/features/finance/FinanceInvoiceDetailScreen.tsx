import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { Header } from "@/components/Header";
import { CreatePaymentRequestScreen } from "@/features/payment-requests/CreatePaymentRequestScreen";
import { invoicePaymentPrefill } from "@/payment-requests/prefill";
import { formatMoney } from "@/booking/format";
import { fetchFinanceInvoice, sendFinanceInvoice, type TenantInvoiceDetail } from "@/finance/api";
import { colors, spacing } from "@/theme/colors";

export function FinanceInvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const auth = useTenantAuth();
  const [invoice, setInvoice] = useState<TenantInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!auth || !id) return;
    setError("");
    try {
      setInvoice(await fetchFinanceInvoice(auth, Number(id)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load invoice");
      setInvoice(null);
    }
  }, [auth, id]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  async function handleSend() {
    if (!auth || !invoice) return;
    setBusy(true);
    try {
      setInvoice(await sendFinanceInvoice(auth, invoice.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send invoice");
    } finally {
      setBusy(false);
    }
  }

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading && !invoice) {
    return <LoadingState message="Loading invoice…" />;
  }

  if (!invoice) {
    return (
      <ResponsiveShell>
        <Header
          title="Invoice"
          right={<Button label="Back" variant="ghost" onPress={() => router.back()} />}
        />
        <EmptyState title="Invoice not found" description={error || "Try again from the list."} />
      </ResponsiveShell>
    );
  }

  const prefill = invoicePaymentPrefill(invoice);
  const canSend = invoice.status === "draft";
  const canPay = invoice.balance_due_cents > 0 && !["paid", "cancelled"].includes(invoice.status);

  return (
    <ResponsiveShell>
      <Header
        title={invoice.invoice_number}
        right={<Button label="Back" variant="ghost" onPress={() => router.back()} />}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text style={styles.status}>{invoice.status.replace(/_/g, " ")}</Text>
          <Text style={styles.client}>{invoice.customer?.name ?? "Walk-in client"}</Text>
          <Text style={styles.total}>{formatMoney(invoice.total_cents, invoice.currency)}</Text>
          {invoice.balance_due_cents > 0 ? (
            <Text style={styles.due}>Balance due {formatMoney(invoice.balance_due_cents, invoice.currency)}</Text>
          ) : null}
        </Card>

        {invoice.items.map((item) => (
          <Card key={item.id} style={styles.line}>
            <Text style={styles.lineTitle}>{item.description}</Text>
            <Text style={styles.lineAmount}>{formatMoney(item.line_total_cents, invoice.currency)}</Text>
          </Card>
        ))}

        <View style={styles.actions}>
          {canSend ? <Button label={busy ? "Sending…" : "Mark as sent"} variant="secondary" onPress={() => void handleSend()} disabled={busy} /> : null}
          {canPay && prefill ? (
            <Button label="Request payment" onPress={() => setPaymentOpen(true)} />
          ) : null}
        </View>

        {paymentOpen && prefill ? (
          <Card style={styles.paymentCard}>
            <Text style={styles.paymentHint}>Your customer will approve payment on their own phone.</Text>
            <CreatePaymentRequestScreen
              embedded
              prefill={prefill}
              onDone={() => {
                setPaymentOpen(false);
                void load();
              }}
            />
          </Card>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing["2xl"], gap: spacing.sm },
  card: { padding: spacing.md, alignItems: "center" },
  status: { textTransform: "capitalize", color: colors.muted, fontSize: 13 },
  client: { fontSize: 16, fontWeight: "600", color: colors.foreground, marginTop: spacing.xs },
  total: { fontSize: 28, fontWeight: "700", color: colors.foreground, marginTop: spacing.sm },
  due: { color: colors.muted, marginTop: spacing.xs },
  line: { flexDirection: "row", justifyContent: "space-between", padding: spacing.md },
  lineTitle: { flex: 1, color: colors.foreground },
  lineAmount: { fontWeight: "600", color: colors.foreground },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  paymentCard: { padding: spacing.md, marginTop: spacing.sm },
  paymentHint: { color: colors.muted, fontSize: 13, marginBottom: spacing.sm },
  error: { color: colors.destructive, fontSize: 14 },
});
