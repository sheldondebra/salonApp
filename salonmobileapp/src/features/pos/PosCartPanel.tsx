import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { formatMoney } from "@/booking/format";
import type { CartLine, PosClient } from "@/pos/types";
import { colors, radii, spacing } from "@/theme/colors";

type PosCartPanelProps = {
  currency: string;
  cart: CartLine[];
  clients: PosClient[];
  clientUserId: string;
  onClientChange: (id: string) => void;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  onUpdateQty: (key: string, delta: number) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  compact?: boolean;
};

export function PosCartPanel({
  currency,
  cart,
  clients,
  clientUserId,
  onClientChange,
  subtotalCents,
  discountCents,
  totalCents,
  onUpdateQty,
  onRemove,
  onClear,
  onCheckout,
  compact,
}: PosCartPanelProps) {
  return (
    <View style={[styles.panel, compact && styles.panelCompact]}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <Ionicons name="cart" size={22} color={colors.accent} />
          <Text style={styles.headTitle}>Cart</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cart.reduce((n, l) => n + l.quantity, 0)}</Text>
          </View>
        </View>
        {cart.length > 0 ? (
          <Pressable onPress={onClear} hitSlop={8}>
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.customerLabel}>Customer</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientScroll}>
        <Pressable
          onPress={() => onClientChange("")}
          style={[styles.clientChip, !clientUserId && styles.clientChipActive]}
        >
          <Ionicons
            name="walk-outline"
            size={16}
            color={!clientUserId ? colors.primaryForeground : colors.mutedForeground}
          />
          <Text style={[styles.clientChipText, !clientUserId && styles.clientChipTextActive]}>
            Walk-in
          </Text>
        </Pressable>
        {clients.slice(0, 20).map((c) => (
          <Pressable
            key={c.id}
            onPress={() => onClientChange(String(c.id))}
            style={[styles.clientChip, clientUserId === String(c.id) && styles.clientChipActive]}
          >
            <Text
              style={[
                styles.clientChipText,
                clientUserId === String(c.id) && styles.clientChipTextActive,
              ]}
              numberOfLines={1}
            >
              {c.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.lines} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {cart.length === 0 ? (
          <Text style={styles.empty}>Tap products or services to add items</Text>
        ) : (
          cart.map((line) => (
            <View key={line.key} style={styles.line}>
              <View style={styles.lineBody}>
                <Text style={styles.lineName} numberOfLines={2}>
                  {line.name}
                </Text>
                <Text style={styles.lineMeta}>
                  {line.type} · {formatMoney(line.unitCents, currency)}
                  {line.maxQty != null ? ` · max ${line.maxQty}` : ""}
                </Text>
              </View>
              <View style={styles.qtyRow}>
                <Pressable onPress={() => onUpdateQty(line.key, -1)} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={18} color={colors.black} />
                </Pressable>
                <Text style={styles.qty}>{line.quantity}</Text>
                <Pressable onPress={() => onUpdateQty(line.key, 1)} style={styles.qtyBtn}>
                  <Ionicons name="add" size={18} color={colors.black} />
                </Pressable>
              </View>
              <Pressable onPress={() => onRemove(line.key)} hitSlop={8} style={styles.trash}>
                <Ionicons name="trash-outline" size={18} color={colors.destructive} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        {discountCents > 0 ? (
          <View style={styles.totalRow}>
            <Text style={styles.subLabel}>Discount</Text>
            <Text style={[styles.subValue, { color: colors.success }]}>
              -{formatMoney(discountCents, currency)}
            </Text>
          </View>
        ) : null}
        <View style={styles.totalRow}>
          <Text style={styles.subLabel}>Subtotal</Text>
          <Text style={styles.subValue}>{formatMoney(subtotalCents, currency)}</Text>
        </View>
        <View style={styles.dueRow}>
          <Text style={styles.dueLabel}>Total</Text>
          <Text style={styles.dueValue}>{formatMoney(totalCents, currency)}</Text>
        </View>
        <Button
          label={`Checkout · ${formatMoney(totalCents, currency)}`}
          onPress={onCheckout}
          disabled={cart.length === 0}
          style={styles.checkoutBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 320,
  },
  panelCompact: { minHeight: 0 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  headLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headTitle: { fontSize: 18, fontWeight: "800", color: colors.black },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: colors.primaryForeground },
  clear: { fontSize: 13, fontWeight: "600", color: colors.destructive },
  customerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  clientScroll: { maxHeight: 44, marginBottom: spacing.sm },
  clientChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.background,
  },
  clientChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  clientChipText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground, maxWidth: 120 },
  clientChipTextActive: { color: colors.primaryForeground },
  lines: { flex: 1, maxHeight: 280 },
  empty: { textAlign: "center", color: colors.mutedForeground, paddingVertical: spacing.xl, fontSize: 14 },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineBody: { flex: 1, minWidth: 0 },
  lineName: { fontSize: 14, fontWeight: "600", color: colors.black },
  lineMeta: { fontSize: 11, color: colors.mutedForeground, marginTop: 2, textTransform: "capitalize" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  qty: { width: 24, textAlign: "center", fontWeight: "700", fontSize: 15 },
  trash: { padding: 4 },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: 6 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  subLabel: { fontSize: 13, color: colors.mutedForeground },
  subValue: { fontSize: 13, fontWeight: "600", color: colors.black },
  dueRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  dueLabel: { fontSize: 16, fontWeight: "700", color: colors.black },
  dueValue: { fontSize: 22, fontWeight: "800", color: colors.accent },
  checkoutBtn: { marginTop: spacing.sm },
});
