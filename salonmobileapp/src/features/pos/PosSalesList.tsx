import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatMoney } from "@/booking/format";
import type { Sale } from "@/pos/types";
import { colors, radii, spacing } from "@/theme/colors";

type PosSalesListProps = {
  currency: string;
  sales: Sale[];
  loading: boolean;
  onOpenReceipt: (saleId: number) => void;
};

export function PosSalesList({ currency, sales, loading, onOpenReceipt }: PosSalesListProps) {
  if (loading) {
    return <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />;
  }

  if (sales.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="receipt-outline" size={48} color={colors.mutedForeground} />
        <Text style={styles.emptyTitle}>No sales yet</Text>
        <Text style={styles.emptySub}>Complete a checkout to see transactions here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {sales.map((sale) => (
        <Pressable
          key={sale.id}
          onPress={() => onOpenReceipt(sale.id)}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="receipt-outline" size={22} color={colors.accent} />
          </View>
          <View style={styles.body}>
            <Text style={styles.number}>{sale.sale_number ?? sale.uuid.slice(0, 8)}</Text>
            <Text style={styles.meta}>
              {new Date(sale.created_at).toLocaleString()} · {sale.client?.name ?? "Walk-in"}
            </Text>
            <Text style={styles.branch}>{sale.location?.name ?? "—"}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.total}>{formatMoney(sale.total_cents, sale.currency ?? currency)}</Text>
            <View style={styles.payBadge}>
              <Text style={styles.payText}>{sale.payment_method.replace(/_/g, " ")}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowPressed: { opacity: 0.92 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: `${colors.accent}14`,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  number: { fontSize: 15, fontWeight: "700", color: colors.black },
  meta: { fontSize: 12, color: colors.mutedForeground },
  branch: { fontSize: 11, color: colors.mutedForeground },
  right: { alignItems: "flex-end", gap: 4 },
  total: { fontSize: 15, fontWeight: "800", color: colors.black },
  payBadge: {
    backgroundColor: colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  payText: { fontSize: 10, fontWeight: "600", color: colors.primaryForeground, textTransform: "capitalize" },
  empty: { alignItems: "center", paddingVertical: spacing.xl * 2, gap: spacing.sm },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.black },
  emptySub: { fontSize: 14, color: colors.mutedForeground, textAlign: "center" },
});
