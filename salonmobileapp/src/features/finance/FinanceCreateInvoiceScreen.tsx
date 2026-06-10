import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { Header } from "@/components/Header";
import { createFinanceInvoice } from "@/finance/api";
import { colors, radii, spacing } from "@/theme/colors";

export function FinanceCreateInvoiceScreen() {
  const router = useRouter();
  const auth = useTenantAuth();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  async function handleCreate() {
    if (!auth) return;
    const amountCents = Math.round(parseFloat(amount || "0") * 100);
    if (!description.trim() || amountCents < 1) {
      setError("Add a description and amount");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const invoice = await createFinanceInvoice(auth, {
        due_date: dueDate || null,
        notes: notes.trim() || null,
        items: [{ description: description.trim(), quantity: 1, unit_price_cents: amountCents }],
      });
      router.replace(`/workplace/finance/invoices/${invoice.id}` as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create invoice");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ResponsiveShell>
      <Header
        title="Create invoice"
        right={<Button label="Back" variant="ghost" onPress={() => router.back()} />}
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.hint}>Add a simple one-line invoice. You can send it and request payment next.</Text>
          <Text style={styles.label}>Description</Text>
          <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Service or product" placeholderTextColor={colors.muted} />
          <Text style={styles.label}>Amount</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.muted} />
          <Text style={styles.label}>Due date (optional)</Text>
          <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} />
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Note for client" placeholderTextColor={colors.muted} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label={saving ? "Creating…" : "Create invoice"} onPress={() => void handleCreate()} disabled={saving} />
        </Card>
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing["2xl"] },
  card: { gap: spacing.sm, padding: spacing.md },
  hint: { color: colors.muted, fontSize: 14, marginBottom: spacing.sm },
  label: { fontSize: 12, color: colors.muted, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.foreground,
    backgroundColor: colors.surface,
  },
  error: { color: colors.destructive, fontSize: 14 },
});
