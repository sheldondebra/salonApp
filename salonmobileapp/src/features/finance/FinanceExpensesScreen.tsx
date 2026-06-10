import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatMoney } from "@/booking/format";
import {
  createFinanceExpense,
  fetchExpenseCategories,
  fetchFinanceExpenses,
  type ExpenseCategory,
  type TenantExpense,
} from "@/finance/api";
import { colors, radii, spacing } from "@/theme/colors";

export function FinanceExpensesScreen() {
  const auth = useTenantAuth();
  const [rows, setRows] = useState<TenantExpense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const [expRes, cats] = await Promise.all([
        fetchFinanceExpenses(auth, { q: debouncedQuery.trim() || undefined }),
        fetchExpenseCategories(auth),
      ]);
      setRows(expRes.data ?? []);
      setCategories(cats);
      if (!categoryId && cats[0]) setCategoryId(cats[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load expenses");
      setRows([]);
    }
  }, [auth, debouncedQuery, categoryId]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  async function handleSave() {
    if (!auth || !categoryId) return;
    const amountCents = Math.round(parseFloat(amount || "0") * 100);
    if (amountCents < 1) {
      setError("Enter a valid amount");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createFinanceExpense(auth, {
        expense_category_id: categoryId,
        vendor_name: vendor.trim() || null,
        amount_cents: amountCents,
        note: note.trim() || null,
      });
      setShowForm(false);
      setVendor("");
      setAmount("");
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save expense");
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

  return (
    <ResponsiveShell>
      <ScreenHeader title="Expenses" subtitle="Track rent, supplies, and operating costs" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load().finally(() => setRefreshing(false)); }} />}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.search}
          placeholder="Search vendor or note…"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />

        {!showForm ? (
          <Button label="Record expense" onPress={() => setShowForm(true)} />
        ) : (
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Quick expense</Text>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[styles.chip, categoryId === cat.id && styles.chipActive]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>{cat.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.label}>Vendor (optional)</Text>
            <TextInput style={styles.input} value={vendor} onChangeText={setVendor} placeholder="Who did you pay?" placeholderTextColor={colors.muted} />
            <Text style={styles.label}>Amount</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.muted} />
            <Text style={styles.label}>Note (optional)</Text>
            <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="What was this for?" placeholderTextColor={colors.muted} />
            <View style={styles.formActions}>
              <Button label="Cancel" variant="secondary" onPress={() => setShowForm(false)} />
              <Button label={saving ? "Saving…" : "Save"} onPress={() => void handleSave()} disabled={saving} />
            </View>
          </Card>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && rows.length === 0 ? <LoadingState message="Loading expenses…" /> : null}
        {!loading && rows.length === 0 && !error ? (
          <EmptyState title="No expenses yet" description="Tap Record expense to track your first cost." />
        ) : null}

        {rows.map((row) => (
          <Card key={row.id} style={styles.card}>
            <ListRow
              title={row.category?.name ?? "Expense"}
              subtitle={`${row.vendor_name ?? "No vendor"} · ${row.expense_date ?? ""}`}
              right={formatMoney(row.amount_cents, row.currency)}
            />
          </Card>
        ))}
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingBottom: spacing["2xl"], gap: spacing.sm },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.foreground,
    backgroundColor: colors.surface,
  },
  card: { marginBottom: spacing.xs },
  formCard: { gap: spacing.sm, padding: spacing.md },
  formTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
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
  chips: { flexGrow: 0, marginVertical: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.foreground, fontSize: 13 },
  chipTextActive: { color: colors.primaryForeground },
  formActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  error: { color: colors.destructive, fontSize: 14 },
});
